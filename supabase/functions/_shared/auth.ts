import { userClient } from "./supabase.ts";

/**
 * Resolve the authenticated user from the request's JWT, or null if absent /
 * invalid. Every function that writes on behalf of a user must call this — we
 * never trust a user id from the request body.
 */
export async function requireUser(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const { data, error } = await userClient(authHeader).auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}
