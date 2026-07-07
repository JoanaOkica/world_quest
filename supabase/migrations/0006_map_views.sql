-- 0006_map_views.sql
-- Read helpers for the map. Regions are public reference data; expose their
-- geometry as GeoJSON so the client can render polygons without handling WKB.
-- Ownership colouring is joined client-side from `region_owner` (which is
-- already RLS-scoped to you + your friends), so this view carries NO ownership
-- or user data — just the shapes.
create or replace view regions_geojson as
  select
    r.id,
    r.name,
    r.kind,
    ST_AsGeoJSON(r.geom)::json as geojson
  from regions r;
