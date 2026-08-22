-- Avatar storage + profile avatar column
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query → paste → Run).
-- Safe to re-run: every statement is idempotent.

-- 1) Store the avatar URL on the profile so it is queryable (header, team table, etc.)
alter table public.profiles
  add column if not exists avatar_url text;

-- 2) Public "avatars" storage bucket (5 MB per-file limit, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- 3) Storage RLS: public read, and each user may manage only files under their own
--    "{user_id}/..." folder. Upload path used by the app is `${auth.uid()}/avatar-*.ext`.
drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Avatar upload own folder" on storage.objects;
create policy "Avatar upload own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Avatar update own folder" on storage.objects;
create policy "Avatar update own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Avatar delete own folder" on storage.objects;
create policy "Avatar delete own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

