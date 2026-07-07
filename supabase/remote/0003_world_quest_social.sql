-- =====================================================================
-- Migration: world_quest_social          (PENDING owner approval)
-- Friendships, region ownership cache, leaderboards, claim writer and
-- GDPR helpers — everything the app's social features call. All objects
-- live inside world_quest; nothing outside the schema is touched.
--
-- RLS deviation (approved need): claims/region_owner gain a READ
-- exception for ACCEPTED friends — without it the friends map filter
-- and leaderboard are impossible. Writes remain owner/service-only.
-- =====================================================================

-- Profile columns the app expects -------------------------------------
alter table world_quest.profiles
  add column if not exists avatar_url text,
  add column if not exists global_opt_in boolean not null default false;

-- Blocks: sever visibility both ways ----------------------------------
create table world_quest.blocks (
  blocker_id uuid not null references world_quest.profiles(id) on delete cascade,
  blocked_id uuid not null references world_quest.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table world_quest.blocks enable row level security;
create policy "wq own blocks" on world_quest.blocks
  for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Friendships (symmetric; user_a requested user_b) ---------------------
create table world_quest.friendships (
  user_a     uuid not null references world_quest.profiles(id) on delete cascade,
  user_b     uuid not null references world_quest.profiles(id) on delete cascade,
  status     text not null default 'pending', -- 'pending' | 'accepted'
  created_at timestamptz not null default now(),
  primary key (user_a, user_b)
);
alter table world_quest.friendships enable row level security;
create policy "wq see own friendships" on world_quest.friendships
  for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());
create policy "wq request friendship" on world_quest.friendships
  for insert to authenticated
  with check (user_a = auth.uid());
create policy "wq respond friendship" on world_quest.friendships
  for update to authenticated
  using (user_b = auth.uid() or user_a = auth.uid());

-- Helpers ---------------------------------------------------------------
create or replace function world_quest.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer
set search_path = world_quest as $$
  select exists (
    select 1 from world_quest.friendships f
    where f.status = 'accepted'
      and ((f.user_a = a and f.user_b = b) or (f.user_a = b and f.user_b = a))
  );
$$;

create or replace function world_quest.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer
set search_path = world_quest as $$
  select exists (
    select 1 from world_quest.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- region_owner: cache of who currently holds each region ----------------
-- Written ONLY by the service role (score-trip); decay math stays in
-- @terra/core. Readable by the owner and their accepted friends.
create table world_quest.region_owner (
  region_id  uuid primary key references world_quest.regions(id) on delete cascade,
  owner_id   uuid not null references world_quest.profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);
grant select on world_quest.region_owner to authenticated;
alter table world_quest.region_owner enable row level security;
create policy "wq read owner self or friends" on world_quest.region_owner
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (world_quest.are_friends(owner_id, auth.uid())
        and not world_quest.is_blocked(owner_id, auth.uid()))
  );

-- profiles: friends may read each other's display name/handle -----------
create policy "wq read friend profiles" on world_quest.profiles
  for select to authenticated
  using (
    world_quest.are_friends(id, auth.uid())
    and not world_quest.is_blocked(id, auth.uid())
  );

-- claims: READ exception for accepted friends; writes stay owner-only ---
drop policy "wq own claims" on world_quest.claims;
create policy "wq read own or friend claims" on world_quest.claims
  for select to authenticated
  using (
    user_id = auth.uid()
    or (world_quest.are_friends(user_id, auth.uid())
        and not world_quest.is_blocked(user_id, auth.uid()))
  );
create policy "wq write own claims" on world_quest.claims
  for insert to authenticated with check (user_id = auth.uid());
create policy "wq update own claims" on world_quest.claims
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "wq delete own claims" on world_quest.claims
  for delete to authenticated using (user_id = auth.uid());

-- Atomic claim reinforcement (called by score-trip with service role) ----
create or replace function world_quest.reinforce_claim(
  p_user_id uuid, p_region_id uuid, p_add_points double precision, p_at timestamptz
) returns void language sql security definer
set search_path = world_quest as $$
  insert into world_quest.claims (user_id, region_id, weighted_points, last_reinforced_at)
  values (p_user_id, p_region_id, p_add_points, p_at)
  on conflict (user_id, region_id) do update
    set weighted_points    = world_quest.claims.weighted_points + excluded.weighted_points,
        last_reinforced_at = excluded.last_reinforced_at;
$$;
revoke execute on function world_quest.reinforce_claim(uuid, uuid, double precision, timestamptz)
  from public, authenticated;

-- Friend graph RPCs (exact-handle discovery only — anti-enumeration) -----
create or replace function world_quest.find_user_by_handle(p_handle text)
returns table (id uuid, display_name text)
language sql stable security definer set search_path = world_quest as $$
  select p.id, p.display_name
  from world_quest.profiles p
  where lower(p.handle) = lower(p_handle)
    and p.id <> auth.uid()
    and not world_quest.is_blocked(p.id, auth.uid())
  limit 1;
$$;

create or replace function world_quest.send_friend_request(p_target uuid)
returns void language plpgsql security definer set search_path = world_quest as $$
begin
  if p_target = auth.uid() then
    raise exception 'cannot friend yourself';
  end if;
  if world_quest.is_blocked(p_target, auth.uid()) then
    raise exception 'blocked';
  end if;
  if exists (
    select 1 from world_quest.friendships f
    where (f.user_a = auth.uid() and f.user_b = p_target)
       or (f.user_a = p_target and f.user_b = auth.uid())
  ) then
    return;
  end if;
  insert into world_quest.friendships (user_a, user_b, status)
  values (auth.uid(), p_target, 'pending');
end;
$$;

create or replace function world_quest.accept_friend_request(p_from uuid)
returns void language sql security definer set search_path = world_quest as $$
  update world_quest.friendships
  set status = 'accepted'
  where user_a = p_from and user_b = auth.uid() and status = 'pending';
$$;

create or replace function world_quest.my_friendships()
returns table (other_id uuid, display_name text, status text, direction text)
language sql stable security definer set search_path = world_quest as $$
  select
    case when f.user_a = auth.uid() then f.user_b else f.user_a end as other_id,
    p.display_name,
    f.status,
    case when f.user_a = auth.uid() then 'outgoing' else 'incoming' end as direction
  from world_quest.friendships f
  join world_quest.profiles p
    on p.id = case when f.user_a = auth.uid() then f.user_b else f.user_a end
  where f.user_a = auth.uid() or f.user_b = auth.uid();
$$;

-- Leaderboards ------------------------------------------------------------
create or replace function world_quest.friend_scores()
returns table (user_id uuid, display_name text, regions_owned bigint)
language sql stable security definer set search_path = world_quest as $$
  select p.id, p.display_name, count(ro.region_id)
  from world_quest.profiles p
  left join world_quest.region_owner ro on ro.owner_id = p.id
  where p.id = auth.uid()
     or (world_quest.are_friends(p.id, auth.uid())
         and not world_quest.is_blocked(p.id, auth.uid()))
  group by p.id, p.display_name
  order by count(ro.region_id) desc;
$$;

-- Global board: pseudonymous, opt-in, aggregates only. The view runs as its
-- owner (bypasses RLS) and exposes NOTHING beyond handle + region count.
create or replace view world_quest.global_leaderboard as
  select
    p.handle,
    count(ro.region_id)::bigint as regions_owned,
    rank() over (order by count(ro.region_id) desc)::bigint as rank
  from world_quest.profiles p
  join world_quest.region_owner ro on ro.owner_id = p.id
  where p.global_opt_in and p.handle is not null
  group by p.handle;
grant select on world_quest.global_leaderboard to authenticated;

-- GDPR --------------------------------------------------------------------
create or replace function world_quest.export_my_data()
returns jsonb language sql stable security definer set search_path = world_quest as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile',      (select to_jsonb(p) from world_quest.profiles p where p.id = auth.uid()),
    'trips',        (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                       from world_quest.trips t where t.user_id = auth.uid()),
    'trip_regions', (select coalesce(jsonb_agg(to_jsonb(tr)), '[]'::jsonb)
                       from world_quest.trip_regions tr
                       join world_quest.trips t on t.id = tr.trip_id and t.user_id = auth.uid()),
    'captures',     (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
                       from world_quest.captures c where c.user_id = auth.uid()),
    'claims',       (select coalesce(jsonb_agg(to_jsonb(cl)), '[]'::jsonb)
                       from world_quest.claims cl where cl.user_id = auth.uid()),
    'friendships',  (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
                       from world_quest.friendships f
                       where f.user_a = auth.uid() or f.user_b = auth.uid())
  );
$$;

create or replace function world_quest.my_capture_storage_paths()
returns setof text language sql stable security definer set search_path = world_quest as $$
  select storage_path from world_quest.captures where user_id = auth.uid();
$$;

-- New tables created after the 0001 grant need their own grants.
grant select, insert, update, delete on world_quest.blocks, world_quest.friendships to authenticated;
