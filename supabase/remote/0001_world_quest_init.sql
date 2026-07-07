-- =====================================================================
-- Migration: world_quest_init            (applied to remote 2026-07-07)
-- Adds the World Quest app in an ISOLATED schema. Does not alter, drop
-- or migrate anything that exists (public / pet-game untouched).
-- =====================================================================

create schema if not exists world_quest;
grant usage on schema world_quest to authenticated;

-- App profile (isolated from the pet game's public.profiles).
create table world_quest.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default '',
  handle        text unique,
  created_at    timestamptz not null default now()
);

-- Region catalog — SHARED reference data, no personal data. No PostGIS on
-- this project: bounding boxes in degrees, containment by bbox.
create table world_quest.regions (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  kind     text not null default 'city',
  min_lng  double precision not null,
  min_lat  double precision not null,
  max_lng  double precision not null,
  max_lat  double precision not null
);

create table world_quest.trips (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references world_quest.profiles(id) on delete cascade,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  transport_mode text not null,
  distance_m     integer,
  status         text not null default 'draft',
  created_at     timestamptz not null default now()
);
create index trips_user_idx on world_quest.trips(user_id);

create table world_quest.trip_regions (
  trip_id   uuid not null references world_quest.trips(id) on delete cascade,
  region_id uuid not null references world_quest.regions(id),
  primary key (trip_id, region_id)
);

create table world_quest.captures (
  id                 uuid primary key default gen_random_uuid(),
  trip_id            uuid not null references world_quest.trips(id) on delete cascade,
  user_id            uuid not null references world_quest.profiles(id) on delete cascade,
  storage_path       text not null,
  lat                double precision not null,
  lng                double precision not null,
  captured_at        timestamptz not null,
  integrity_verified boolean not null default false,
  created_at         timestamptz not null default now()
);
create index captures_trip_idx on world_quest.captures(trip_id);

create table world_quest.claims (
  user_id            uuid not null references world_quest.profiles(id) on delete cascade,
  region_id          uuid not null references world_quest.regions(id),
  weighted_points    double precision not null default 0,
  last_reinforced_at timestamptz not null default now(),
  primary key (user_id, region_id)
);

grant select, insert, update, delete on all tables in schema world_quest to authenticated;

alter table world_quest.profiles     enable row level security;
alter table world_quest.regions      enable row level security;
alter table world_quest.trips        enable row level security;
alter table world_quest.trip_regions enable row level security;
alter table world_quest.captures     enable row level security;
alter table world_quest.claims       enable row level security;

create policy "wq own profile" on world_quest.profiles
  for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "wq own trips" on world_quest.trips
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "wq own trip_regions" on world_quest.trip_regions
  for all to authenticated
  using (exists (select 1 from world_quest.trips t
                 where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from world_quest.trips t
                 where t.id = trip_id and t.user_id = auth.uid()));

create policy "wq own captures" on world_quest.captures
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "wq own claims" on world_quest.claims
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- regions: shared catalog; authenticated read, client writes blocked
-- (no write policy — only migrations/service role insert regions).
create policy "wq read regions" on world_quest.regions
  for select to authenticated using (true);
