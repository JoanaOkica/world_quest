-- 0005_storage_policies.sql
-- RLS for the private `captures` bucket. Convention: objects are stored under a
-- path prefixed by the owner's uid, e.g. `<uid>/<trip>/<uuid>.jpg`. Users may
-- upload and read only their own objects; everyone else receives short-lived
-- signed URLs minted server-side after EXIF stripping (never direct access).
-- The bucket itself is created via config.toml ([storage.buckets.captures]).

drop policy if exists "own captures upload" on storage.objects;
create policy "own captures upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own captures read" on storage.objects;
create policy "own captures read" on storage.objects for select to authenticated
  using (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own captures delete" on storage.objects;
create policy "own captures delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
