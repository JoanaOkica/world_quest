# Safety & security

> A build spec, not advice. The single design decision behind all of it:
> **separate "who you compete with" from "what others can see about you"** — two
> independent axes — and make every safety guarantee enforced in the **data layer**, not
> the UI. If a rule is only enforced client-side, it does not exist.

## Threat model

Primary threat: **someone using the app to locate or follow a specific person** (a solo
traveler, an ex, a stranger who fixates on a rank). Secondary: data breach exposing
location history; home/work address inference; account takeover; scraping "who is near X".

We are NOT primarily defending against nation-state actors. We ARE defending against:
stalkers, harassers, scrapers, spoofed clients, and our own bugs leaking private rows.

## Privacy scopes (three levels, each exposes strictly less)

| Scope | Who sees it | What they see |
|-------|-------------|---------------|
| **Private (you)** | only you + server | raw GPS traces, capture photos with exact coords, precise trip times |
| **Friends (mutual opt-in)** | accepted friends | **region-level** claims + scores, **delayed**. No GPS point, no route, no live position. |
| **Global (opt-in)** | all users | rank + score + **chosen handle** only. **No map, no locations, no real name.** |

Consequences:
- Friends-only + never joining global = fully private competition.
- Global rank exposes an aggregate score under a pseudonym — you can be world #5 with zero
  location exposure.
- A user can be in both scopes at once; they are independent toggles.

## The two non-negotiable safety rules

1. **Never real-time.** No one — not strangers, not friends — ever sees a live position.
   A trip's territory becomes visible only **after the trip ends** (or after a lag). This
   removes the "intercept me now" vector, which is the core risk for solo travelers.
2. **Always coarse.** Others only ever see the **region** claimed, never a GPS point or
   route. Precision lives server-side for verification only.

Both are free: the game is about accumulating and *holding* decaying territory over time,
not a real-time position race. Safe design == good design here.
**v1 decision: do not build live location sharing at all.** It's the riskiest feature and
the game doesn't need it.

## Privacy zones (home/work protection)

Even without live location, trips that all start/end at one point reveal where you live
(this is the Strava heatmap failure). Required from day one:
- Users can define one or more **privacy zones** (radius around a point).
- Activity inside a zone is hidden or fuzzed; **trip endpoints are never rendered
  precisely** to anyone else, ever.
- Default the first zone via a prompt on first trip; never auto-publish a raw endpoint.

## Cybersecurity controls (with acceptance criteria)

**Authorization in the database (Row-Level Security).** Already enabled in
`supabase/migrations/0001_init.sql`. The scope rules above are enforced as RLS policies +
query design, NOT client filtering.
- ✅ A crafted API call with another user's ID returns zero private rows.
- ✅ Friends queries return region-level aggregates only; raw GPS is never selectable by
  anyone but the owner.
- ✅ The global leaderboard endpoint exposes only `handle`, `score`, `rank`.
- ✅ Claims are writable only by the service role (the `score-trip` function), never
  directly by clients.

**Key handling.** App ships the **anon key only**; the **service-role key stays
server-side** (already the rule in `CLAUDE.md` / `lib/supabase.ts`).
- ✅ No service-role key, admin secret, or provider token appears in the mobile bundle.

**Photos.** Served via **short-lived signed URLs**; **EXIF GPS stripped** server-side
before any non-owner can view them (a photo's metadata leaks exact coords otherwise).
- ✅ Downloaded capture bytes contain no GPS EXIF.
- ✅ Signed URLs expire; no public bucket for captures.

**Client integrity.** App Attest (iOS) / Play Integrity (Android) via the
`verify-capture` function block spoofed/emulated clients.
- ✅ A capture from an unattested client is rejected before scoring.

**Anti-enumeration & rate limiting.** No endpoint lets someone scrape "users near location
X" or iterate user IDs/handles.
- ✅ Friend search requires an exact handle/code, not fuzzy proximity.
- ✅ Auth, friend-request, and search endpoints are rate-limited.

**Data minimization & expiry** (GDPR + safety: data you don't keep can't leak).
- Keep coarse claims long-term; **delete raw GPS traces after the verification window**.
- Account delete is a **hard delete** incl. Storage objects (see `docs/privacy-gdpr.md`).

**User controls.** Block + report ship in v1. Blocking severs all visibility both ways.
- ✅ There is no mechanism for a stranger to silently follow one person's detailed
  movements. Following is mutual-consent (friends) and coarse + delayed only.

## Threat → control map (why this is coherent, not a pile of features)

| Threat | Closed by |
|--------|-----------|
| Intercept me right now | never real-time (temporal delay) |
| Pinpoint where I am/was | region-only coarsening |
| Find my home | privacy zones + no precise endpoints |
| Silently watch a stranger | mutual-consent friends; global board is pseudonymous + mapless |
| Rank without exposure | global scope = handle + score only |
| Leak via photo metadata | EXIF stripping + signed URLs |
| Leak via bug / bad API call | RLS enforces authz in the data layer |
| Spoofed client | device attestation |
| Scrape who's near X | anti-enumeration + rate limits |
| Breach of stored history | data minimization + raw-trace expiry |
| Ongoing harassment | block/report |

## Build order
Privacy zones, RLS scope policies, and EXIF stripping are **v1** — they must exist before
any location is ever shown to a second person. Everything else layers on top.
