import { useMutation } from "@tanstack/react-query";
import * as Location from "expo-location";
import { captureInputSchema } from "@terra/core";
import { supabase } from "../../lib/supabase";
import { invokeFunction } from "../../lib/functions";
import { getAttestationToken } from "./attestation";

const BUCKET = "captures";

/**
 * Turn a freshly-taken live photo into verified proof:
 *   1. Read the current GPS position (foreground, only while capturing).
 *   2. Upload the photo to the private captures bucket under `<uid>/<trip>/…`.
 *   3. Call `verify-capture` (attestation + ST_Contains) to mark it verified.
 * The photo URI MUST come from the in-app camera — there is no gallery path.
 */
export function useCapture(tripId: string) {
  return useMutation({
    mutationFn: async (photoUri: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Foreground location permission — requested at the moment of capture.
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") throw new Error("Location permission is required for proof");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Upload the image bytes.
      const path = `${user.id}/${tripId}/${Date.now()}.jpg`;
      const bytes = await (await fetch(photoUri)).arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw upErr;

      const payload = {
        tripId,
        storagePath: path,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        capturedAt: new Date(pos.timestamp).toISOString(),
        attestation: await getAttestationToken(),
      };
      // Validate against the shared schema before it leaves the device.
      captureInputSchema.parse(payload);

      return invokeFunction<{ ok: boolean; captureId: string; regionId: string }>(
        "verify-capture",
        payload,
      );
    },
  });
}
