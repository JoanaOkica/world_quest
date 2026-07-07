import { describe, it, expect } from "vitest";
import { visitPoints, tripPoints } from "./points.js";
import { transportMultiplier, BASE_POINTS_PER_REGION } from "./multipliers.js";
import { decayedClaimValue, currentOwner, CLAIM_HALF_LIFE_DAYS } from "./claims.js";
import type { Claim } from "../types/index.js";

describe("points", () => {
  it("rewards greener transport more", () => {
    expect(transportMultiplier("walk")).toBeGreaterThan(transportMultiplier("car"));
    expect(transportMultiplier("train")).toBeGreaterThan(transportMultiplier("plane"));
  });

  it("gives a flight a near-zero, easily-overtaken token", () => {
    const plane = visitPoints({ regionId: "r", mode: "plane" });
    const train = visitPoints({ regionId: "r", mode: "train" });
    expect(plane).toBeLessThan(train);
    expect(plane).toBe(BASE_POINTS_PER_REGION * 0.1);
  });

  it("sums points across every region touched", () => {
    const total = tripPoints([
      { regionId: "a", mode: "train" },
      { regionId: "b", mode: "train" },
    ]);
    expect(total).toBe(2 * BASE_POINTS_PER_REGION * 2.5);
  });
});

describe("claims + decay", () => {
  const claim = (userId: string, pts: number, at: string): Claim => ({
    userId,
    regionId: "r",
    weightedPoints: pts,
    lastReinforcedAt: at,
  });

  it("halves a claim after one half-life", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const past = new Date(now.getTime() - CLAIM_HALF_LIFE_DAYS * 86_400_000);
    const v = decayedClaimValue(claim("u", 100, past.toISOString()), now);
    expect(v).toBeCloseTo(50, 5);
  });

  it("lets a fresh weaker claim overtake a stale stronger one", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const longAgo = new Date(now.getTime() - 360 * 86_400_000).toISOString(); // ~4 half-lives
    const local = claim("local", 400, longAgo); // decays to ~25
    const traveler = claim("traveler", 100, now.toISOString()); // stays 100
    expect(currentOwner([local, traveler], now)).toBe("traveler");
  });

  it("returns null for an unclaimed region", () => {
    expect(currentOwner([])).toBeNull();
  });
});
