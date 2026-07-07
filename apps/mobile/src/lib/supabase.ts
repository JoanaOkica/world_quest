import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Anon key only — the service-role key must never reach the client.
// The session is persisted in AsyncStorage and auto-refreshed so users stay
// signed in between launches.
// All app tables live in the isolated `world_quest` schema (the Supabase
// project is shared with another app that owns `public`). The schema must be
// listed under Settings → API → Exposed schemas for these queries to work.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  db: { schema: "world_quest" },
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
