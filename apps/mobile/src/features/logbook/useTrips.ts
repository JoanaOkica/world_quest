import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { Trip } from "../../types";

/** The signed-in user's own trip history. RLS returns only their rows. */
export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: async (): Promise<Trip[]> => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Trip[];
    },
  });
}
