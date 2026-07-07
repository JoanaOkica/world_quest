# CLAUDE.md — project context for Claude Code

> Read this first. It defines the stack, the structure, the scoring mechanic, and
> what is deliberately **out of scope** for v1. Do not build deferred items.

## What this is

**terra** (working codename — rename freely) is a mobile app where friends compete to
claim cities/regions by traveling to them. The greener the transport (train, bus, bike,
walk), the more points a visit is worth and the stronger the claim — so traveling
sustainably literally lets you paint more of the map. Think: Fog of World × Strava
segments × a low-carbon nudge.

Three layers, stacked (not balanced):
1. **Logbook (foundation)** — personal trip history. Works solo on day one.
2. **Competition (engine)** — friends leaderboard + steal-able territory. Drives retention.
3. **Green scoring (the rule)** — not a feature, it's *how points are awarded*.

## Stack

- **Mobile:** React Native + Expo (dev build, not managed-only), TypeScript.
  Maps: `@rnmapbox/maps`. Camera: `expo-camera`. Data: TanStack Query. State: Zustand.
- **Backend:** Supabase — Postgres + **PostGIS** (regions/geometry), Auth (phone/SMS),
  Storage (capture photos), Edge Functions (Deno/TypeScript).
- **Shared:** `packages/core` — pure TS scoring + domain types + zod schemas, imported by
  BOTH the app (optimistic UI) and edge functions (authoritative). Never duplicate scoring.

## Monorepo layout

```
apps/mobile      React Native app (feature-based folders under src/features)
packages/core    Pure shared logic: scoring, types, validation
supabase         migrations/ (SQL + PostGIS), functions/ (edge functions), seed.sql
docs             architecture, data-model, scoring, mvp-scope, privacy-gdpr,
                 monetization, safety-and-security
```

Tooling: pnpm workspaces. Run the app from `apps/mobile`; run the DB via Supabase CLI.

## Scoring mechanic (see docs/scoring.md for the full spec)

- A visit to a region earns `basePoints × transportMultiplier`.
- Multipliers reward ground travel; flights earn almost nothing. Source of truth:
  `packages/core/src/scoring/multipliers.ts`.
- Your **claim** on a region = your accumulated weighted points there, **decaying** over
  time (exponential, ~90-day half-life). Whoever has the highest *current decayed claim*
  owns the region's color. Decay is what stops locals owning their city forever and keeps
  the map alive.

## MVP SCOPE — build only this in v1

**In v1:** phone (SMS) auth · MANUAL trip logging · transport-mode picker · live in-app
photo capture (gallery upload disabled) · city/region claims with decay · friends
leaderboard · map coloring · GDPR export/delete.

**NOT in v1 (do not build unless asked):**
- Passive/background location tracking + automatic transport detection (hard; validate the
  fun loop first with manual logging).
- **AI-generated-image detection** — do not build this ever. It doesn't work reliably.
  Trust comes from *live capture + device attestation + GPS binding*, not pixel analysis.
- Heavy anti-fraud ML. Phone verification + device integrity (App Attest / Play Integrity)
  + rejecting impossible GPS jumps is enough for v1.
- Payments/monetization, B2B/company leagues.

## Non-negotiable rules

- **Capture is live-only.** Never add an image-picker/gallery path for proof photos.
- **Scoring lives once**, in `packages/core`. Client and server both import it.
- **Row-Level Security on everything.** Users read/write only their own rows; leaderboards
  expose only aggregates among friends. EU users → GDPR export & hard-delete must work.
- **PostGIS for regions.** Use `ST_Contains` / spatial indexes; don't hand-roll geometry.
- Location data is sensitive. Minimize what's stored; never put it in URLs/logs.

## Conventions

- TypeScript strict everywhere. Feature-based folders (`src/features/<feature>`).
- No secrets in the repo; use `.env` (see `.env.example`). Edge functions read env, never
  hardcode keys. Never expose the Supabase service-role key to the app.
