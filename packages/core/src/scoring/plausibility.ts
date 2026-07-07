import type { CapturePoint, LatLng } from "../types/index.js";

/**
 * Physical-plausibility guardrails. A trip is rejected before scoring if it
 * requires teleporting between captures. This is cheap anti-spoof (see
 * docs/architecture.md §Verification pipeline) — not fraud ML.
 */

/** Fastest ground/air speed we will tolerate between two captures (m/s). */
export const MAX_PLAUSIBLE_SPEED_MPS = 300; // ~1080 km/h, above any airliner cruise

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two points, in metres (haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Implied speed (m/s) to travel between two captures. Infinity if simultaneous. */
export function impliedSpeedMps(a: CapturePoint, b: CapturePoint): number {
  const meters = haversineMeters(a.at, b.at);
  const seconds = Math.abs(
    new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  ) / 1000;
  if (seconds === 0) return meters === 0 ? 0 : Infinity;
  return meters / seconds;
}

/**
 * True if a chronological sequence of captures never requires an impossible
 * speed between consecutive points. Order-independent: it sorts by time first.
 */
export function isPlausibleSequence(
  points: CapturePoint[],
  maxSpeedMps: number = MAX_PLAUSIBLE_SPEED_MPS,
): boolean {
  const sorted = [...points].sort(
    (x, y) => new Date(x.capturedAt).getTime() - new Date(y.capturedAt).getTime(),
  );
  for (let i = 1; i < sorted.length; i++) {
    if (impliedSpeedMps(sorted[i - 1], sorted[i]) > maxSpeedMps) return false;
  }
  return true;
}
