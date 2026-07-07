-- 0001_init.sql — schema for terra. PostGIS + Row-Level Security throughout.
create extension if not exists postgis;

-- profiles: exists only after SMS verification -----------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar_url    text,
  phone_verified boolean not null default false,
  created_at    timestamptz not null default now()
);

-- regions: the claimable units (cities / admin regions) --------------------
create table regions (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  kind    text not null default 'city',            -- 'city' | 'region'
  geom    geometry(MultiPolygon, 4326) not null
);
create index regions_geom_gix on regions using gist (geom);

-- helper: which region contains a point
create or replace function region_at(lng double precision, lat double precision)
returns uuid language sql stable as $$
  select id from regions
  where ST_Contains(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
  limit 1;
$$;

-- trips --------------------------------------------------------------------
create table trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  started_at  timestamptz not null,
  ended_at    timestamptz,
  transport_mode text not null,                     -- validated in app/core
  distance_m  integer,
  status      text not null default 'draft',        -- 'draft' | 'verified'
  created_at  timestamptz not null default now()
);

create table trip_regions (
  trip_id   uuid not null references trips(id) on delete cascade,
  region_id uuid not null references regions(id),
  primary key (trip_id, region_id)
);

-- captures: live in-app photo proof ----------------------------------------
create table captures (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references trips(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  storage_path  text not null,
  lat           double precision not null,
  lng           double precision not null,
  captured_at   timestamptz not null,
  integrity_verified boolean not null default false,
  created_at    timestamptz not null default now()
);

-- claims: accumulated weighted points; owner derived via decay in core -----
create table claims (
  user_id            uuid not null references profiles(id) on delete cascade,
  region_id          uuid not null references regions(id),
  weighted_points    double precision not null default 0,
  last_reinforced_at timestamptz not null default now(),
  primary key (user_id, region_id)
);

-- friendships (symmetric) --------------------------------------------------
create table friendships (
  user_a  uuid not null references profiles(id) on delete cascade,
  user_b  uuid not null references profiles(id) on delete cascade,
  status  text not null default 'pending',          -- 'pending' | 'accepted'
  created_at timestamptz not null default now(),
  primary key (user_a, user_b)
);

-- Row-Level Security -------------------------------------------------------
alter table profiles     enable row level security;
alter table trips        enable row level security;
alter table trip_regions enable row level security;
alter table captures     enable row level security;
alter table claims       enable row level security;
alter table friendships  enable row level security;
-- regions is public read-only (no RLS insert/update from clients).

-- Minimal starter policies (tighten before launch):
create policy "own profile"  on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own trips"    on trips for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own captures" on captures for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- claims: readable by the owner and their accepted friends (for the map/leaderboard).
-- Write only via the score-trip edge function (service role). See docs/scoring.md.
