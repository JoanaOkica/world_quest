import { describe, it, expect } from "vitest";
import { isPlausibleSequence, haversineMeters, impliedSpeedMps } from "./plausibility.js";
import type { CapturePoint } from "../types/index.js";

describe("plausibility", () => {
  it("measures known distances roughly right", () => {
    // Lisbon -> Porto is ~275km great-circle.
    const d = haversineMeters({ lat: 38.72, lng: -9.14 }, { lat: 41.15, lng: -8.61 });
    expect(d).toBeGreaterThan(260_000);
    expect(d).toBeLessThan(290_000);
  });

  it("accepts a train-speed sequence", () => {
    const seq: CapturePoint[] = [
      { at: { lat: 38.72, lng: -9.14 }, capturedAt: "2026-07-01T08:00:00Z" },
      { at: { lat: 41.15, lng: -8.61 }, capturedAt: "2026-07-01T11:00:00Z" }, // 3h for 275km
    ];
    expect(isPlausibleSequence(seq)).toBe(true);
  });

  it("rejects a teleport (impossible speed)", () => {
    const seq: CapturePoint[] = [
      { at: { lat: 38.72, lng: -9.14 }, capturedAt: "2026-07-01T08:00:00Z" },
      { at: { lat: 41.15, lng: -8.61 }, capturedAt: "2026-07-01T08:00:30Z" }, // 275km in 30s
    ];
    expect(isPlausibleSequence(seq)).toBe(false);
  });

  it("treats simultaneous different points as impossible", () => {
    const a: CapturePoint = { at: { lat: 0, lng: 0 }, capturedAt: "2026-07-01T08:00:00Z" };
    const b: CapturePoint = { at: { lat: 1, lng: 1 }, capturedAt: "2026-07-01T08:00:00Z" };
    expect(impliedSpeedMps(a, b)).toBe(Infinity);
  });
});
