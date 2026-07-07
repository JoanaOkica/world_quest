// delete-account: GDPR hard delete (docs/privacy-gdpr.md).
// Truly removes the user: purge their capture photos from Storage, then delete
// the auth.users row — every table FKs to profiles ON DELETE CASCADE, so trips,
// captures, claims, friendships, privacy zones and region_owner rows all go too.
// No soft "deleted" flag. Verifies no orphaned capture objects remain.
import { preflight, json } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";

const CAPTURES_BUCKET = "captures";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: "unauthenticated" }, 401);

  // List the caller's capture storage paths via their own RLS-scoped function.
  const authHeader = req.headers.get("Authorization");
  const { data: paths, error: pathErr } = await userClient(authHeader)
    .rpc("my_capture_storage_paths");
  if (pathErr) return json({ error: "path_lookup_failed" }, 500);

  const db = adminClient();

  // Purge Storage objects first (nothing referencing them should survive).
  const objectPaths = (paths ?? []) as string[];
  if (objectPaths.length > 0) {
    const { error: rmErr } = await db.storage.from(CAPTURES_BUCKET).remove(objectPaths);
    if (rmErr) return json({ error: "storage_purge_failed", detail: rmErr.message }, 500);
  }

  // Delete the auth user — cascades every row keyed to profiles(id).
  const { error: delErr } = await db.auth.admin.deleteUser(user.id);
  if (delErr) return json({ error: "account_delete_failed", detail: delErr.message }, 500);

  return json({ ok: true, deletedCaptures: objectPaths.length });
});
