# Data model

All tables live in Postgres with the PostGIS extension enabled. Row-Level Security is ON
for every table. Full DDL: `supabase/migrations/0001_init.sql`.

## Tables

**profiles** — one row per user, keyed to `auth.users.id`.
Holds display name, avatar, `phone_verified`. A user only exists here after SMS verification.

**regions** — the claimable units (cities / admin regions). `geom geometry(MultiPolygon)`
with a GiST spatial index. Seeded from an open boundary dataset (Natural Earth / GADM /
OSM admin boundaries). This is the "cities/regions" granularity chosen for v1.
→ "Which region contains this point?" = `SELECT id FROM regions WHERE ST_Contains(geom, pt)`.

**trips** — one journey. `user_id`, `started_at`, `ended_at`, `transport_mode`,
`distance_m`, `status` (`draft` | `verified`). In v1 these are created manually.

**trip_regions** — join table: a trip touched region X. `(trip_id, region_id)`.
This is what `score-trip` iterates over to award points.

**captures** — proof photos. `trip_id`, `storage_path`, `lat`, `lng`, `captured_at`,
`integrity_verified` (bool). Created only via live in-app camera.

**claims** — the heart of the game. `(user_id, region_id)` unique. `weighted_points`
(accumulated) + `last_reinforced_at` (for decay). The *current owner* of a region is the
user whose **decayed** claim is highest — computed in `packages/core/scoring/claims.ts`,
not stored raw. Optionally cache a materialized `region_owner` view for fast map reads.

**friendships** — `(user_a, user_b)`, symmetric, plus `status` (`pending` | `accepted`).
Territory is contested among accepted friends in v1.

## Relationships

```
profiles 1───∞ trips 1───∞ trip_regions ∞───1 regions
profiles 1───∞ captures                 regions 1───∞ claims ∞───1 profiles
profiles ∞───∞ profiles (via friendships)
```

## Why PostGIS (not a lookup table)

Regions are real polygons. Mapping a GPS trace to the regions it passed through, and
checking a capture actually falls inside a claimed region, are spatial containment queries.
PostGIS + a GiST index does this in milliseconds; a naive bounding-box table does not.
