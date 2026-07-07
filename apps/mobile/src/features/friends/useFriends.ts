import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export interface FriendRow {
  other_id: string;
  display_name: string;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing";
}

/** The caller's friendships (accepted + pending, both directions). */
export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: async (): Promise<FriendRow[]> => {
      const { data, error } = await supabase.rpc("my_friendships");
      if (error) throw error;
      return (data ?? []) as FriendRow[];
    },
  });
}

/** Look up a user by EXACT handle and send them a friend request. */
export function useAddFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (handle: string) => {
      const { data, error } = await supabase.rpc("find_user_by_handle", {
        p_handle: handle.replace(/^@/, ""),
      });
      if (error) throw error;
      const match = (data ?? [])[0] as { id: string } | undefined;
      if (!match) throw new Error("No user with that handle");
      const { error: reqErr } = await supabase.rpc("send_friend_request", {
        p_target: match.id,
      });
      if (reqErr) throw reqErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends"] }),
  });
}

/** Accept an incoming request. */
export function useAcceptFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fromId: string) => {
      const { error } = await supabase.rpc("accept_friend_request", { p_from: fromId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["map-data"] });
    },
  });
}
