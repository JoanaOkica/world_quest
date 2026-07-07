# Scoring spec

Implemented as pure functions in `packages/core/src/scoring/`. Imported by the app
(optimistic UI) and by the `score-trip` edge function (authoritative). Numbers below are
**tunable defaults** — treat them as config, not truth.

## 1. Points for a visit

```
visitPoints = BASE_POINTS_PER_REGION × transportMultiplier(mode)
```

`BASE_POINTS_PER_REGION = 100` (default).

## 2. Transport multipliers (multipliers.ts)

| mode  | ×    | intent                          |
|-------|------|---------------------------------|
| walk  | 3.0  | greenest, hardest → most reward |
| bike  | 3.0  |                                 |
| train | 2.5  | the behavior we most want       |
| bus   | 2.0  |                                 |
| ferry | 1.5  |                                 |
| car   | 0.5  | tolerated, weakly rewarded      |
| plane | 0.1  | near-zero; a flat token, easily overtaken |

Effect: fly into a city and your claim there is weak and easily stolen. Take the train and
you claim it strongly *plus* the regions you passed through. Green travel paints more map.

## 3. Claims and decay (claims.ts)

A claim accumulates weighted points but **decays exponentially** so it must be refreshed:

```
decayed(points, lastReinforcedAt, now) = points × 0.5 ^ (daysBetween / HALF_LIFE_DAYS)
HALF_LIFE_DAYS = 90   // default
```

**Region owner** = the friend with the highest *decayed* claim right now.

Why decay: without it, whoever visits first (usually a local) owns their city forever and
the map freezes. With it, a passing traveler can overtake a claim that's gone stale — the
leaderboard stays contested and alive.

## 4. Anti-abuse guardrails on scoring

- A visit only scores if backed by a capture whose GPS falls inside the region and whose
  device integrity check passed.
- Impossible-speed transitions between regions are rejected before scoring.
