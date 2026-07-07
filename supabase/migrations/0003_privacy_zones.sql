-- 0003_privacy_zones.sql
-- Home/work protection (docs/safety-and-security.md §Privacy zones). A trip
-- endpoint inside a zone is never rendered precisely to anyone. Zones are
-- strictly private: only the owner can ever read or write them.
create table if not exists privacy_zones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  label      text,
  center     geography(Point, 4326) not null,
  radius_m   integer not null check (radius_m between 50 and 20000),
  created_at timestamptz not null default now()
);
create index if not exists privacy_zones_user_idx on privacy_zones (user_id);

alter table privacy_zones enable row level security;

drop policy if exists "own privacy zones" on privacy_zones;
create policy "own privacy zones" on privacy_zones for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Does a point fall inside any of the user's privacy zones? Used server-side
-- before any endpoint is shared. Coarsening for sharing is done in @terra/core.
create or replace function point_in_privacy_zone(
  p_user_id uuid, p_lng double precision, p_lat double precision
) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from privacy_zones z
    where z.user_id = p_user_id
      and ST_DWithin(z.center, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, z.radius_m)
  );
$$;
