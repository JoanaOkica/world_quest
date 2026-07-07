# supabase (backend)

- `migrations/` — SQL schema (PostGIS + RLS). Apply with `supabase db reset`.
- `functions/` — Deno/TypeScript edge functions (authoritative scoring & verification).
- `seed.sql` — demo regions so the map renders locally; swap for a real boundary import.

Edge functions import scoring from `@terra/core` (see `functions/deno.json` import map) so
rules match the client exactly.

## Migrations

| file | what |
|------|------|
| `0001_init.sql`            | tables, PostGIS `regions`, `region_at()`, RLS enabled |
| `0002_rls_and_ownership.sql` | friend-scoped RLS, `region_owner` cache, `reinforce_claim()`, handles/blocks, leaderboards |
| `0003_privacy_zones.sql`   | home/work privacy zones (private-only) |
| `0004_gdpr.sql`            | `export_my_data()` + capture-path list for hard delete |
| `0005_storage_policies.sql` | private `captures` bucket RLS (owner-only; others via signed URLs) |

## Functions

| function | auth | role |
|----------|------|------|
| `verify-capture`  | user JWT | attestation + `ST_Contains` → persist verified capture |
| `score-trip`      | user JWT | plausibility + reinforce claims (**only writer to `claims`**) + refresh owners |
| `resolve-claims`  | service key | recompute decayed owners on a schedule |
| `delete-account`  | user JWT | GDPR hard delete: purge Storage + `auth.users` (cascades) |

**Decay + owner selection live once, in `@terra/core`** — never re-implemented in SQL.
`_shared/regionOwner.ts` is the single path that resolves ownership.

## Local run

```bash
supabase start                 # Postgres + PostGIS + Auth + Storage
supabase db reset              # apply migrations + seed
supabase functions serve       # run edge functions locally (ATTESTATION_MODE=dev)
```
