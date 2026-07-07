// verify-capture: turns a live photo into trustworthy proof.
//   1. Auth: resolve the user from the JWT (never from the body).
//   2. Device integrity: App Attest / Play Integrity must pass.
//   3. Spatial: the capture's GPS must fall inside a region (ST_Contains).
//   4. Persist the capture with integrity_verified = true.
// Proof is "was this created live, here, now?" — not "is this photo real?".
// See docs/architecture.md.
import { captureInputSchema } from "@terra/core";
import { preflight, json } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { verifyAttestation } from "../_shared/attestation.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: "unauthenticated" }, 401);

  const parsed = captureInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues }, 400);
  const { tripId, storagePath, lat, lng, capturedAt, attestation } = parsed.data;

  const attest = await verifyAttestation(attestation);
  if (!attest.ok) return json({ error: "attestation_failed", reason: attest.reason }, 403);

  const db = adminClient();

  // The trip must belong to the caller.
  const { data: trip, error: tripErr } = await db
    .from("trips").select("id, user_id").eq("id", tripId).single();
  if (tripErr || !trip || trip.user_id !== user.id) {
    return json({ error: "trip_not_found" }, 404);
  }

  // The photo must live under the caller's own folder for this trip — a
  // capture row must never point at another user's object (or nothing).
  if (!storagePath.startsWith(`${user.id}/${tripId}/`)) {
    return json({ error: "storage_path_not_owned" }, 403);
  }

  // Which region contains this point? (bbox containment via region_at()).
  const { data: regionId, error: regionErr } = await db
    .rpc("region_at", { p_lng: lng, p_lat: lat });
  if (regionErr) return json({ error: "region_lookup_failed" }, 500);
  if (!regionId) return json({ error: "capture_outside_any_region" }, 422);

  const { data: capture, error: insErr } = await db
    .from("captures")
    .insert({
      trip_id: tripId,
      user_id: user.id,
      storage_path: storagePath,
      lat,
      lng,
      captured_at: capturedAt,
      integrity_verified: true,
    })
    .select("id")
    .single();
  if (insErr) return json({ error: "capture_insert_failed" }, 500);

  return json({ ok: true, captureId: capture.id, regionId });
});
