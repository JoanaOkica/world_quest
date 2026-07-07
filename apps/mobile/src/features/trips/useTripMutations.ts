import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTripInputSchema, type TransportMode } from "@terra/core";
import { supabase } from "../../lib/supabase";
import { invokeFunction } from "../../lib/functions";
import { useUserId } from "../../state/authStore";

/**
 * Create a draft trip + its trip_regions rows (manual logging — v1). Returns the
 * new trip id, which the capture + scoring steps then reference.
 */
export function useCreateTrip() {
  const userId = useUserId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      mode: TransportMode;
      regionIds: string[];
      startedAt: string;
      endedAt?: string;
    }): Promise<string> => {
      if (!userId) throw new Error("Not signed in");
      // Validate with the shared schema so client + server agree.
      createTripInputSchema.parse(input);

      const { data: trip, error } = await supabase
        .from("trips")
        .insert({
          user_id: userId,
          started_at: input.startedAt,
          ended_at: input.endedAt ?? null,
          transport_mode: input.mode,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw error;

      const rows = input.regionIds.map((region_id) => ({ trip_id: trip.id, region_id }));
      const { error: trErr } = await supabase.from("trip_regions").insert(rows);
      if (trErr) throw trErr;

      return trip.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

/**
 * Submit a trip for authoritative scoring. The edge function is the only writer
 * to claims; the client result here is just a confirmation.
 */
export function useScoreTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tripId: string;
      visits: { regionId: string; mode: TransportMode }[];
    }) => {
      return invokeFunction<{ ok: boolean; totalPoints: number }>("score-trip", input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["map-data"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
