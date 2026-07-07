-- 0002_rls_and_ownership.sql
-- Tightens RLS to the scope model in docs/safety-and-security.md (friends see
-- coarse, delayed, region-level claims only), adds the region_owner cache, the
-- atomic claim writer, handles/blocks, and leaderboard helpers.

-- Global scope: pseudonymous handle + opt-in. No real name, no map. ----------
alter table profiles add column if not exists handle text unique;
alter table profiles add column if not exists global_opt_in boolean not null default false;

-- Blocks: severs all visibility both ways (safety doc §User controls). --------
create table if not exists blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table blocks enable row level security;

-- region_owner: cache of "who holds this region right now". Written only by the
-- service role (score-trip / resolve-claims); decay math lives in @terra/core. -
create table if not exists region_owner (
  region_id  uuid primary key references regions(id) on delete cascade,
  owner_id   uuid not null references profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);
alter table region_owner enable row level security;

-- Helpers --------------------------------------------------------------------

-- Are two users accepted friends? (friendships is symmetric.)
create or replace function are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships f
    where f.status = 'accepted'
      and ((f.user_a = a and f.user_b = b) or (f.user_a = b and f.user_b = a))
  );
$$;

-- Has either user blocked the other?
create or replace function is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Atomic claim reinforcement: accumulate weighted points + bump the decay clock.
-- This does NOT compute decay (that lives in @terra/core) — it only accumulates.
-- SECURITY DEFINER so it works regardless of the caller, but it is only ever
-- invoked by the service role from score-trip.
create or replace function reinforce_claim(
  p_user_id uuid, p_region_id uuid, p_add_points double precision, p_at timestamptz
) returns void language sql security definer set search_path = public as $$
  insert into claims (user_id, region_id, weighted_points, last_reinforced_at)
  values (p_user_id, p_region_id, p_add_points, p_at)
  on conflict (user_id, region_id) do update
    set weighted_points   = claims.weighted_points + excluded.weighted_points,
        last_reinforced_at = excluded.last_reinforced_at;
$$;

-- Row-Level Security policies ------------------------------------------------

-- profiles: read your own row and those of accepted friends (for names/handles).
drop policy if exists "read self or friends" on profiles;
create policy "read self or friends" on profiles for select
  using (
    id = auth.uid()
    or (are_friends(id, auth.uid()) and not is_blocked(id, auth.uid()))
  );

-- claims: readable by the owner and their accepted (non-blocked) friends only.
-- No INSERT/UPDATE/DELETE policy exists → clients can never write claims; only
-- the service role (score-trip) can. This is the core anti-cheat guarantee.
drop policy if exists "read own or friends claims" on claims;
create policy "read own or friends claims" on claims for select
  using (
    user_id = auth.uid()
    or (are_friends(user_id, auth.uid()) and not is_blocked(user_id, auth.uid()))
  );

-- region_owner: the same friend scope. The map only colors regions owned by you
-- or a friend; a stranger's ownership is never selectable.
drop policy if exists "read owner self or friends" on region_owner;
create policy "read owner self or friends" on region_owner for select
  using (
    owner_id = auth.uid()
    or (are_friends(owner_id, auth.uid()) and not is_blocked(owner_id, auth.uid()))
  );

-- trip_regions: reachable only through your own trips.
drop policy if exists "own trip regions" on trip_regions;
create policy "own trip regions" on trip_regions for all
  using (exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()));

-- friendships: you can see and manage rows you participate in.
drop policy if exists "see own friendships" on friendships;
create policy "see own friendships" on friendships for select
  using (user_a = auth.uid() or user_b = auth.uid());
drop policy if exists "request friendship" on friendships;
create policy "request friendship" on friendships for insert
  with check (user_a = auth.uid());
drop policy if exists "respond to friendship" on friendships;
create policy "respond to friendship" on friendships for update
  using (user_b = auth.uid() or user_a = auth.uid());

-- blocks: manage only your own blocks.
drop policy if exists "own blocks" on blocks;
create policy "own blocks" on blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Leaderboards ---------------------------------------------------------------

-- Friends leaderboard: how much map each of you + your friends holds. Aggregate
-- only (region counts), never raw claims or locations. SECURITY DEFINER so it
-- can count across friends' region_owner rows without widening RLS.
create or replace function friend_scores()
returns table (user_id uuid, display_name text, regions_owned bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, count(ro.region_id)
  from profiles p
  left join region_owner ro on ro.owner_id = p.id
  where p.id = auth.uid()
     or (are_friends(p.id, auth.uid()) and not is_blocked(p.id, auth.uid()))
  group by p.id, p.display_name
  order by count(ro.region_id) desc;
$$;

-- Global leaderboard: pseudonymous handle + regions owned + rank. NO map, NO
-- real name, NO location — for users who opted in only (safety doc §Global).
create or replace view global_leaderboard as
  select
    p.handle,
    count(ro.region_id) as regions_owned,
    rank() over (order by count(ro.region_id) desc) as rank
  from profiles p
  left join region_owner ro on ro.owner_id = p.id
  where p.global_opt_in = true and p.handle is not null
  group by p.handle;
