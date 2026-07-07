import { z } from "zod";

export const transportModeSchema = z.enum([
  "walk", "bike", "train", "bus", "ferry", "car", "plane",
]);

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const regionVisitSchema = z.object({
  regionId: z.string().uuid(),
  mode: transportModeSchema,
});

export const capturePointSchema = z.object({
  at: latLngSchema,
  capturedAt: z.string().datetime(),
});

/** A capture the app uploads as live proof for a trip. */
export const captureInputSchema = z.object({
  tripId: z.string().uuid(),
  storagePath: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  capturedAt: z.string().datetime(),
  // Opaque attestation blob (App Attest / Play Integrity). Verified server-side.
  attestation: z.string().min(1),
});

/** Payload the app sends to create a trip (manual logging in v1). */
export const createTripInputSchema = z.object({
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  mode: transportModeSchema,
  regionIds: z.array(z.string().uuid()).min(1),
  distanceM: z.number().int().nonnegative().optional(),
});

/** Payload the app sends to the `score-trip` edge function. */
export const scoreTripInputSchema = z.object({
  tripId: z.string().uuid(),
  visits: z.array(regionVisitSchema).min(1),
});

export type CaptureInput = z.infer<typeof captureInputSchema>;
export type CreateTripInput = z.infer<typeof createTripInputSchema>;
export type ScoreTripInput = z.infer<typeof scoreTripInputSchema>;
