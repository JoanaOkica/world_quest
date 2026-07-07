// resolve-claims: recompute decayed claims and refresh the region_owner cache.
// Because claims decay continuously, an owner can change with NO new activity
// (a stale local finally drops below a traveler). Run this on a schedule
// (e.g. hourly via pg_cron / a scheduled function) so the map stays current.
//
// Decay + owner selection come from @terra/core (decayedClaimValue / currentOwner),
// never re-implemented in SQL. Invoke with the service-role key only.
import { preflight, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { refreshRegionOwners, regionsWithClaims } from "../_shared/regionOwner.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  // Cron/service invocation only — require the service-role key as a bearer.
  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return json({ error: "forbidden" }, 403);
  }

  const db = adminClient();
  const regionIds = await regionsWithClaims(db);
  await refreshRegionOwners(db, regionIds);

  return json({ ok: true, regionsResolved: regionIds.length });
});
