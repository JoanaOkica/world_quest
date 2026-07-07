import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { Region } from "../../types";

/** All claimable regions (public reference data), for the manual trip picker. */
export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    staleTime: 60 * 60_000, // regions rarely change
    queryFn: async (): Promise<Region[]> => {
      const { data, error } = await supabase
        .from("regions")
        .select("id, name, kind")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Region[];
    },
  });
}
