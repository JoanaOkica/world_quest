# World Quest

> I had this idea while scrolling around the internet searching for design ideas for
> another app! I thought since we are all travelling why not compete with friends while we
> do it. — the original spark

A mobile app where friends compete to claim cities and regions by **traveling** to them.
The greener the transport (train, bus, bike, walk), the more points a visit is worth and
the stronger your claim — so traveling sustainably literally lets you paint more of the
map. Think **Fog of World × Strava segments × a low-carbon nudge**.

Three layers, stacked:

1. **Logbook** — your personal trip history. Works solo on day one.
2. **Competition** — friends leaderboard + steal-able territory. Drives retention.
3. **Green scoring** — not a feature, it's *how* points are awarded.

> Codename `terra` still appears in package names (`@terra/core`, bundle ids). Rename freely.

## Quick start

```bash
pnpm install                      # install workspace deps
supabase start                    # local Postgres + PostGIS + Auth + Storage (Supabase CLI)
supabase db reset                 # apply migrations + seed demo regions
cp apps/mobile/.env.example apps/mobile/.env   # fill in EXPO_PUBLIC_* values
cd apps/mobile && pnpm run start  # Expo dev build (native modules → not Expo Go)
```

Run the shared-logic tests: `pnpm test`.

## Where things live

| path | what |
|------|------|
| [`apps/mobile`](./apps/mobile)   | React Native / Expo app (feature folders under `src/features`) |
| [`packages/core`](./packages/core) | pure shared scoring + types + zod schemas (imported by app **and** edge functions) |
| [`supabase`](./supabase)         | Postgres/PostGIS migrations, edge functions, seed data |
| [`docs`](./docs)                 | architecture, data model, scoring spec, MVP scope, privacy/GDPR, safety |

## How a trip becomes territory

```
Log a trip (regions + transport mode) + LIVE photo proof
   → verify-capture   (device attestation + GPS inside region via ST_Contains)
   → score-trip       (basePoints × transportMultiplier, from @terra/core)
   → claims           (weighted points, decaying ~90-day half-life)
   → resolve-claims   (current owner = highest DECAYED claim per region)
   → the map recolors; the friends leaderboard updates
```

Decay is the engine: it stops locals from owning their city forever and keeps the
leaderboard contested. Fly somewhere and your claim is weak and easily stolen; take the
train and you claim it strongly *plus* every region you passed through.

## Ground rules (non-negotiable)

- **Capture is live-only.** No gallery/image-picker path for proof, ever.
- **Scoring lives once**, in `@terra/core`. Client and server both import it — no drift.
- **Row-Level Security on everything.** Friends see coarse, delayed, region-level claims;
  the global board is pseudonymous and map-less. GDPR export + hard-delete must work.
- **PostGIS for regions.** `ST_Contains` + spatial indexes; never hand-roll geometry.
- Location is sensitive — minimize what's stored; never put it in URLs or logs.

**Start here:** [`CLAUDE.md`](./CLAUDE.md), then [`docs/mvp-scope.md`](./docs/mvp-scope.md)
and [`docs/safety-and-security.md`](./docs/safety-and-security.md).
