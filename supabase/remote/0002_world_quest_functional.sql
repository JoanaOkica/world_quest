-- =====================================================================
-- Migration: world_quest_functional
-- Seed regions + the point→region helper the edge functions depend on.
-- Everything stays inside the world_quest schema.
-- =====================================================================

-- Demo regions (approximate bounding boxes) so the map and claims work.
insert into world_quest.regions (name, kind, min_lng, min_lat, max_lng, max_lat) values
  ('Lisboa',    'city', -9.23, 38.69, -9.09, 38.80),
  ('Porto',     'city', -8.68, 41.13, -8.55, 41.20),
  ('Madrid',    'city', -3.80, 40.33, -3.55, 40.51),
  ('Barcelona', 'city',  2.09, 41.32,  2.23, 41.47),
  ('Paris',     'city',  2.22, 48.81,  2.47, 48.91),
  ('Berlim',    'city', 13.09, 52.34, 13.76, 52.68);

-- Which region contains a point (bbox containment, no PostGIS).
create or replace function world_quest.region_at(p_lng double precision, p_lat double precision)
returns uuid language sql stable set search_path = world_quest as $$
  select id from world_quest.regions
  where p_lng between min_lng and max_lng
    and p_lat between min_lat and max_lat
  limit 1;
$$;

grant execute on function world_quest.region_at(double precision, double precision) to authenticated;
