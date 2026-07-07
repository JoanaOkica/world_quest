import type { TransportMode } from "../types/index.js";

/**
 * Transport multipliers — the core green nudge. Tunable config, not gospel.
 * Ground travel is rewarded; flights earn a near-zero token that is easily overtaken.
 * See docs/scoring.md.
 */
export const TRANSPORT_MULTIPLIERS: Record<TransportMode, number> = {
  walk: 3.0,
  bike: 3.0,
  train: 2.5,
  bus: 2.0,
  ferry: 1.5,
  car: 0.5,
  plane: 0.1,
};

export const BASE_POINTS_PER_REGION = 100;

export function transportMultiplier(mode: TransportMode): number {
  return TRANSPORT_MULTIPLIERS[mode];
}
