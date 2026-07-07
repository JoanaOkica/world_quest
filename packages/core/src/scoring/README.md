# scoring

Pure, deterministic scoring logic SHARED by the app (optimistic UI) and edge functions
(authoritative). Never duplicate this.

- `multipliers.ts` — transport multipliers + `BASE_POINTS_PER_REGION` (the green nudge).
- `points.ts` — `visitPoints` / `tripPoints`.
- `claims.ts` — exponential decay + `currentOwner` (highest decayed claim wins).
- `plausibility.ts` — haversine + GPS-jump rejection (impossible-speed transitions).

Privacy-zone coarsening lives in `../privacy/zones.ts`. Tests: `*.test.ts` (`pnpm --filter @terra/core test`).
