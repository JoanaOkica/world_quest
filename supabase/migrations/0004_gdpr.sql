-- 0004_gdpr.sql
-- GDPR export + the pieces hard-delete needs (docs/privacy-gdpr.md). Export is a
-- single call returning everything we hold about the caller. Hard delete of the
-- account itself runs in the `delete-account` edge function (it must also purge
-- Storage objects and the auth.users row, which SQL cannot do) — this migration
-- provides the storage-path list that function consumes.

-- Everything we hold about the calling user, as one JSON document.
create or replace function export_my_data()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile',      (select to_jsonb(p) from profiles p where p.id = auth.uid()),
    'trips',        (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                       from trips t where t.user_id = auth.uid()),
    'trip_regions', (select coalesce(jsonb_agg(to_jsonb(tr)), '[]'::jsonb)
                       from trip_regions tr
                       join trips t on t.id = tr.trip_id and t.user_id = auth.uid()),
    'captures',     (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
                       from captures c where c.user_id = auth.uid()),
    'claims',       (select coalesce(jsonb_agg(to_jsonb(cl)), '[]'::jsonb)
                       from claims cl where cl.user_id = auth.uid()),
    'friendships',  (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
                       from friendships f
                       where f.user_a = auth.uid() or f.user_b = auth.uid()),
    'privacy_zones',(select coalesce(jsonb_agg(to_jsonb(z)), '[]'::jsonb)
                       from privacy_zones z where z.user_id = auth.uid())
  );
$$;

-- Storage paths of the caller's capture photos, so the delete-account function
-- can purge them from the Storage bucket before removing the account.
create or replace function my_capture_storage_paths()
returns setof text language sql stable security definer set search_path = public as $$
  select storage_path from captures where user_id = auth.uid();
$$;
