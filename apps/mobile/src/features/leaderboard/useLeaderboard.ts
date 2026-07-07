import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { FriendScore, GlobalRow } from "../../types";

/** Friends leaderboard: aggregate region counts for you + accepted friends. */
export function useFriendLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard", "friends"],
    queryFn: async (): Promise<FriendScore[]> => {
      const { data, error } = await supabase.rpc("friend_scores");
      if (error) throw error;
      return (data ?? []) as FriendScore[];
    },
  });
}

/** Global board: pseudonymous handle + rank only. No map, no names, no location. */
export function useGlobalLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard", "global"],
    queryFn: async (): Promise<GlobalRow[]> => {
      const { data, error } = await supabase
        .from("global_leaderboard")
        .select("handle, regions_owned, rank")
        .order("rank")
        .limit(100);
      if (error) throw error;
      return (data ?? []) as GlobalRow[];
    },
  });
}
