import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// All app objects live in the isolated `world_quest` schema — the Supabase
// project is shared with another app that owns `public`. The schema must be
// in the API's exposed-schemas list for PostgREST to serve it.
const APP_SCHEMA = "world_quest";

/**
 * Admin client — bypasses RLS. This is the ONLY writer to `claims`
 * (see docs/scoring.md). Never expose the service-role key to the app.
 */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: APP_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * A client scoped to the caller's JWT — subject to RLS. Used to resolve the
 * authenticated user and to read/write only their own rows.
 */
export function userClient(authHeader: string | null): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader ?? "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
