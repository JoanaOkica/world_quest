// score-trip: authoritative scoring for a completed trip.
// Runs with the service role — the ONLY writer to `claims` (see docs/scoring.md).
//   1. Auth: resolve the user from the JWT.
//   2. Guard: the trip is the caller's, and every scored region is backed by an
//      integrity-verified capture that falls inside it.
//   3. Guard: capture sequence must be physically plausible (no teleporting).
//   4. Reinforce claims via @terra/core scoring, mark the trip verified, and
//      refresh the region_owner cache for the affected regions.
import {
  scoreTripInputSchema,
  visitPoints,
  isPlausibleSequence,
  transportModeSchema,
  MODE_MAX_SPEED_MPS,
  type CapturePoint,
} from "@terra/core";
import { preflight, json } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { refreshRegionOwners } from "../_shared/regionOwner.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: "unauthenticated" }, 401);

  const parsed = scoreTripInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues }, 400);
  const { tripId, visits } = parsed.data;

  const db = adminClient();

  // The trip must belong to the caller and not already be scored.
  const { data: trip, error: tripErr } = await db
    .from("trips").select("id, user_id, status, transport_mode").eq("id", tripId).single();
  if (tripErr || !trip || trip.user_id !== user.id) {
    return json({ error: "trip_not_found" }, 404);
  }
  if (trip.status === "verified") return json({ error: "trip_already_scored" }, 409);

  // The mode is NEVER taken from the request body — a client could log a
  // plane trip (×0.1) and then claim "walk" (×3.0) at scoring time. The
  // stored trip row is the single source of truth for the multiplier.
  const modeParsed = transportModeSchema.safeParse(trip.transport_mode);
  if (!modeParsed.success) return json({ error: "invalid_trip_mode" }, 422);
  const mode = modeParsed.data;

  // Pull the trip's integrity-verified captures. Each proves presence in the
  // region that contains its GPS point.
  const { data: captures, error: capErr } = await db
    .from("captures")
    .select("lat, lng, captured_at")
    .eq("trip_id", tripId)
    .eq("integrity_verified", true);
  if (capErr) return json({ error: "capture_lookup_failed" }, 500);
  if (!captures || captures.length === 0) {
    return json({ error: "no_verified_capture" }, 422);
  }

  // Plausibility: reject impossible-speed transitions between captures. The
  // ceiling comes from the trip's STORED mode, so a flight logged as ground
  // travel is caught here (walking speed can't cover flight distances).
  const points: CapturePoint[] = captures.map((c) => ({
    at: { lat: c.lat, lng: c.lng },
    capturedAt: new Date(c.captured_at).toISOString(),
  }));
  if (!isPlausibleSequence(points, MODE_MAX_SPEED_MPS[mode])) {
    return json({ error: "implausible_trip_for_mode" }, 422);
  }

  // Resolve which regions the captures actually prove presence in.
  const provenRegions = new Set<string>();
  for (const c of captures) {
    const { data: regionId } = await db.rpc("region_at", { p_lng: c.lng, p_lat: c.lat });
    if (regionId) provenRegions.add(regionId as string);
  }

  // Only score visits that a verified capture actually backs.
  const scored = visits.filter((v) => provenRegions.has(v.regionId));
  if (scored.length === 0) return json({ error: "no_region_proven" }, 422);

  // Reinforce each claim atomically (upsert + increment) via SQL function.
  const now = new Date().toISOString();
  const results: { regionId: string; points: number }[] = [];
  for (const v of scored) {
    const pts = visitPoints({ regionId: v.regionId, mode });
    const { error: rErr } = await db.rpc("reinforce_claim", {
      p_user_id: user.id,
      p_region_id: v.regionId,
      p_add_points: pts,
      p_at: now,
    });
    if (rErr) return json({ error: "claim_reinforce_failed", detail: rErr.message }, 500);
    results.push({ regionId: v.regionId, points: pts });
  }

  await db.from("trips").update({ status: "verified" }).eq("id", tripId);

  // Refresh cached owner for the touched regions (highest decayed claim wins).
  // Decay math lives in @terra/core via refreshRegionOwners — never in SQL.
  await refreshRegionOwners(db, results.map((r) => r.regionId));

  const totalPoints = results.reduce((s, r) => s + r.points, 0);
  return json({ ok: true, scored: results, totalPoints });
});
