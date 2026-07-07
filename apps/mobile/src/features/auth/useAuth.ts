import { useState } from "react";
import { supabase } from "../../lib/supabase";

/**
 * Phone (SMS) sign-in. Phone verification is the primary anti-spam gate
 * (docs/mvp-scope.md). Two steps: request an OTP, then verify it.
 */
export function usePhoneAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(phone: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  async function verifyOtp(phone: string, token: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) {
      setLoading(false);
      setError(error.message);
      return false;
    }
    // First-login bootstrap: every user needs a row in world_quest.profiles
    // (all app tables FK to it). Done in-app instead of an auth.users trigger
    // so every object of this app stays inside its own schema. Idempotent.
    const userId = data.session?.user.id ?? data.user?.id;
    if (userId) {
      await supabase
        .from("profiles")
        .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
    }
    setLoading(false);
    return true; // onAuthStateChange updates the store → navigation switches.
  }

  return { sendOtp, verifyOtp, loading, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}
