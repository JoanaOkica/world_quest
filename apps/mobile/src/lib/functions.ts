import { supabase } from "./supabase";

/**
 * Call a Supabase Edge Function with the current user's JWT attached.
 * `supabase.functions.invoke` forwards the session automatically, but we wrap
 * it to surface errors consistently and keep call sites terse.
 */
export async function invokeFunction<T = unknown>(
  name: string,
  body?: unknown,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body: body ?? {},
  });
  if (error) throw error;
  return data as T;
}
