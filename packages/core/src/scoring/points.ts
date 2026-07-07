import type { RegionVisit } from "../types/index.js";
import { BASE_POINTS_PER_REGION, transportMultiplier } from "./multipliers.js";

/** Points earned for a single region visit: base × transport multiplier. */
export function visitPoints(visit: RegionVisit): number {
  return BASE_POINTS_PER_REGION * transportMultiplier(visit.mode);
}

/** Total points across all regions touched on a trip. */
export function tripPoints(visits: RegionVisit[]): number {
  return visits.reduce((sum, v) => sum + visitPoints(v), 0);
}
