export type TransportMode =
  | "walk" | "bike" | "train" | "bus" | "ferry" | "car" | "plane";

export type TripStatus = "draft" | "verified";

/** A single point on the earth. Precision is kept server-side only. */
export interface LatLng {
  lat: number;
  lng: number;
}

export interface RegionVisit {
  regionId: string;
  mode: TransportMode;
}

export interface Claim {
  userId: string;
  regionId: string;
  weightedPoints: number;
  lastReinforcedAt: string; // ISO 8601
}

/**
 * A circular zone (e.g. home/work) whose activity is hidden or fuzzed.
 * Endpoints inside a zone are never rendered precisely to anyone. See
 * docs/safety-and-security.md.
 */
export interface PrivacyZone {
  center: LatLng;
  radiusM: number;
}

/** A capture point + when it was taken, used for plausibility checks. */
export interface CapturePoint {
  at: LatLng;
  capturedAt: string; // ISO 8601
}
