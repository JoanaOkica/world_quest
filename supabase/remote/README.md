# Remote migrations — shared Supabase project

The production Supabase project (`virtual-pet-game`, ref `ypnrlvylutmqsiftfili`)
is **shared with another app** that owns the `public` schema. World Quest lives
entirely inside the isolated **`world_quest`** schema and must never touch
`public` or any data of the other app.

These files mirror, in order, the migrations applied (or to be applied) to that
remote project. They differ from `../migrations/` (the original standalone
design), most importantly:

- every object lives in the `world_quest` schema, never `public`;
- **no PostGIS** — the shared project doesn't have it installed, so regions are
  bounding boxes (`min_lng/min_lat/max_lng/max_lat`) and `region_at()` does
  bbox containment;
- profile rows are created by the app on first login (no trigger on
  `auth.users`, to keep every object inside our own schema).

| File | Status |
|---|---|
| `0001_world_quest_init.sql` | ✅ applied 2026-07-07 |
| `0002_world_quest_functional.sql` | ✅ applied 2026-07-08 |
| `0003_world_quest_social.sql` | ⏳ pending owner approval |

Apply via the Supabase MCP `apply_migration`, the SQL editor, or
`supabase db push` against the remote project. The `world_quest` schema must
also be added to **Settings → API → Exposed schemas** for the REST API (used by
the app and the edge functions) to reach it.
