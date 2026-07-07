-- Seed demo regions so the map renders locally. Rough bounding boxes only —
-- replace with a real boundary import (Natural Earth / GADM / OSM admin
-- boundaries) before launch. Cities skew toward the Interrail wedge
-- (docs/mvp-scope.md §First user wedge).
insert into regions (name, kind, geom) values
  ('Lisbon',    'city', ST_Multi(ST_GeomFromText('POLYGON((-9.23 38.69, -9.09 38.69, -9.09 38.80, -9.23 38.80, -9.23 38.69))', 4326))),
  ('Porto',     'city', ST_Multi(ST_GeomFromText('POLYGON((-8.68 41.13, -8.55 41.13, -8.55 41.20, -8.68 41.20, -8.68 41.13))', 4326))),
  ('Madrid',    'city', ST_Multi(ST_GeomFromText('POLYGON((-3.80 40.33, -3.55 40.33, -3.55 40.51, -3.80 40.51, -3.80 40.33))', 4326))),
  ('Barcelona', 'city', ST_Multi(ST_GeomFromText('POLYGON((2.09 41.32, 2.23 41.32, 2.23 41.47, 2.09 41.47, 2.09 41.32))', 4326))),
  ('Paris',     'city', ST_Multi(ST_GeomFromText('POLYGON((2.22 48.81, 2.47 48.81, 2.47 48.91, 2.22 48.91, 2.22 48.81))', 4326))),
  ('Amsterdam', 'city', ST_Multi(ST_GeomFromText('POLYGON((4.73 52.32, 5.03 52.32, 5.03 52.43, 4.73 52.43, 4.73 52.32))', 4326))),
  ('Berlin',    'city', ST_Multi(ST_GeomFromText('POLYGON((13.09 52.34, 13.76 52.34, 13.76 52.68, 13.09 52.68, 13.09 52.34))', 4326))),
  ('Vienna',    'city', ST_Multi(ST_GeomFromText('POLYGON((16.18 48.12, 16.58 48.12, 16.58 48.32, 16.18 48.32, 16.18 48.12))', 4326)))
on conflict do nothing;
