# Architecture

## Why this stack

- **Expo / React Native** — one codebase for iOS + Android; realistic for a small team.
  Uses a *dev build* (not managed-only) because we need native modules: Mapbox, camera,
  and device-integrity attestation.
- **Supabase** — gives us four things this app needs in one place: **PostGIS** (regions are
  polygons; "which region is this GPS point in?" is a spatial query), **phone auth**
  (our main anti-spam gate), **storage** (capture photos), and **Row-Level Security**
  (clean GDPR story). Edge Functions hold the authoritative, cheat-resistant logic.
- **packages/core** — scoring is pure and deterministic, so it lives once and is imported
  by both the client (for instant optimistic UI) and the edge functions (for the real,
  trusted result). One source of truth, no drift.

## Data flow: a trip becomes territory

```
User logs a trip (regions touched + transport mode) + live capture(s)
        │
        ▼
Edge fn `score-trip`  ── imports packages/core/scoring ──► basePoints × multiplier
        │
        ▼
Upsert into `claims` (weighted points, last_reinforced_at)
        │
        ▼
`resolve-claims` recomputes decayed claims ► current owner = max decayed claim per region
        │
        ▼
App reads `claims` + `regions` ► colors the Mapbox map; leaderboard reads aggregates
```

## Verification pipeline (how we trust a claim)

Proof is **not** "is this photo real?" — it's "was this capture created live, here, now?"

1. **Live capture only.** Photos come from the in-app camera; the gallery picker is never
   wired up. The image is created on-device at capture time.
2. **Bind to context.** Each capture stores GPS lat/lng + timestamp + device attestation.
3. **Device integrity.** `verify-capture` checks App Attest (iOS) / Play Integrity
   (Android) so the client is the real, untampered app on a genuine device — this is what
   stops virtual-camera / spoofing attacks, and it doubles as anti-spam.
4. **Sanity checks.** Reject impossible GPS jumps (teleporting) and captures whose location
   doesn't fall inside the claimed region (`ST_Contains`).

Explicitly **not** in the pipeline: AI-image classifiers. They're unreliable and adversarial;
see `mvp-scope.md`.

## Anti-spam (mostly free, by design)

A territory game is naturally hostile to bot farms: to gain and *hold* territory you must
physically move through real places over time. Layer on phone verification at signup +
device attestation + GPS-jump rejection and v1 is well covered. No fraud-ML needed yet.
