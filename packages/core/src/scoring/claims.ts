import type { Claim } from "../types/index.js";

/** Half-life of a claim in days. After this long without reinforcement, a claim halves. */
export const CLAIM_HALF_LIFE_DAYS = 90;

const MS_PER_DAY = 86_400_000;

/** A claim's *current* strength, decayed exponentially since it was last reinforced. */
export function decayedClaimValue(claim: Claim, now: Date = new Date()): number {
  const days =
    (now.getTime() - new Date(claim.lastReinforcedAt).getTime()) / MS_PER_DAY;
  if (days <= 0) return claim.weightedPoints;
  return claim.weightedPoints * Math.pow(0.5, days / CLAIM_HALF_LIFE_DAYS);
}

/**
 * Given every friend's claim on one region, return the current owner's userId
 * (highest decayed claim), or null if the region is unclaimed.
 */
export function currentOwner(claims: Claim[], now: Date = new Date()): string | null {
  let bestUser: string | null = null;
  let best = 0;
  for (const c of claims) {
    const v = decayedClaimValue(c, now);
    if (v > best) {
      best = v;
      bestUser = c.userId;
    }
  }
  return bestUser;
}
