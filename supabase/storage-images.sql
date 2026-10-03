-- Havën Schedule — image storage for cloud-only accounts
-- Run this AFTER supabase/setup-all.sql, in the Supabase dashboard:
-- SQL Editor → New query → paste → Run.
--
-- Images for a signed-in account live at <auth uid>/<image id> in a private
-- bucket. Binary image bytes are stored with their real content type; access
-- is restricted to the owner by matching the first path segment to auth.uid(),
-- so one account can never read or overwrite another account's images.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'haven-user-images',
  'haven-user-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "haven_images_owner_select" on storage.objects;
create policy "haven_images_owner_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'haven-user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "haven_images_owner_insert" on storage.objects;
create policy "haven_images_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'haven-user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "haven_images_owner_update" on storage.objects;
create policy "haven_images_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'haven-user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'haven-user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "haven_images_owner_delete" on storage.objects;
create policy "haven_images_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'haven-user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
