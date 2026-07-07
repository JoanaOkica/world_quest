import type { LatLng, PrivacyZone } from "../types/index.js";
import { haversineMeters } from "../scoring/plausibility.js";

/**
 * Privacy zones: no trip endpoint is ever rendered precisely to a second person
 * (the Strava-heatmap failure). See docs/safety-and-security.md §Privacy zones.
 * These helpers are pure so the client and server agree on what is hidden.
 */

/** True if a point falls inside any of the user's privacy zones. */
export function isInPrivacyZone(point: LatLng, zones: PrivacyZone[]): boolean {
  return zones.some((z) => haversineMeters(point, z.center) <= z.radiusM);
}

/**
 * Redact a point that must never leave the server at full precision. Returns
 * null when the point is inside a privacy zone (it should not be shown at all).
 * Otherwise it is coarsened to ~1km by truncating decimal degrees, so no exact
 * endpoint is ever exposed even outside a zone.
 */
export function coarsenForSharing(
  point: LatLng,
  zones: PrivacyZone[],
): LatLng | null {
  if (isInPrivacyZone(point, zones)) return null;
  const round = (n: number) => Math.round(n * 100) / 100; // ~1.1km at the equator
  return { lat: round(point.lat), lng: round(point.lng) };
}
