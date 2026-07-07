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
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true; // onAuthStateChange updates the store → navigation switches.
  }

  return { sendOtp, verifyOtp, loading, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}
