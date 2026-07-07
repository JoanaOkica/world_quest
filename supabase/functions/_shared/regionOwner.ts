import { currentOwner, type Claim } from "@terra/core";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recompute the current owner of one or more regions and upsert the
 * `region_owner` cache. Decay math lives ONCE, in @terra/core — never in SQL —
 * so this helper (not a DB function) is the only thing that resolves ownership.
 * Called after scoring and on a schedule by `resolve-claims`.
 */
export async function refreshRegionOwners(
  db: SupabaseClient,
  regionIds: string[],
  now: Date = new Date(),
): Promise<void> {
  for (const regionId of regionIds) {
    const { data: rows } = await db
      .from("claims")
      .select("user_id, region_id, weighted_points, last_reinforced_at")
      .eq("region_id", regionId);

    const claims: Claim[] = (rows ?? []).map((r) => ({
      userId: r.user_id,
      regionId: r.region_id,
      weightedPoints: r.weighted_points,
      lastReinforcedAt: new Date(r.last_reinforced_at).toISOString(),
    }));

    const owner = currentOwner(claims, now);
    if (owner) {
      await db.from("region_owner").upsert({
        region_id: regionId,
        owner_id: owner,
        updated_at: now.toISOString(),
      });
    } else {
      await db.from("region_owner").delete().eq("region_id", regionId);
    }
  }
}

/** Every region that currently has at least one claim. */
export async function regionsWithClaims(db: SupabaseClient): Promise<string[]> {
  const { data } = await db.from("claims").select("region_id");
  return [...new Set((data ?? []).map((r) => r.region_id as string))];
}
