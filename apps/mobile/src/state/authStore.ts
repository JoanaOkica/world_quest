import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  /** True until we've checked AsyncStorage for an existing session. */
  initializing: boolean;
  setSession: (session: Session | null) => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initializing: true,
  setSession: (session) => set({ session }),
  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, initializing: false });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },
}));

export const useSession = () => useAuthStore((s) => s.session);
export const useUserId = () => useAuthStore((s) => s.session?.user.id ?? null);
