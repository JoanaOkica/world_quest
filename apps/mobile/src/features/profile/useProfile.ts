import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { invokeFunction } from "../../lib/functions";
import { useUserId } from "../../state/authStore";
import type { Profile } from "../../types";

export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, handle, global_opt_in")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile) ?? null;
    },
  });
}

export function useUpdateProfile() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, "display_name" | "handle" | "global_opt_in">>) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

/** GDPR export — returns everything we hold about the user as one JSON object. */
export async function exportMyData(): Promise<unknown> {
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) throw error;
  return data;
}

/** GDPR hard delete — purges storage + auth user (cascades all rows). */
export async function deleteMyAccount(): Promise<void> {
  await invokeFunction("delete-account");
  await supabase.auth.signOut();
}
