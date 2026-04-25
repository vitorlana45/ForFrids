-- Tutor profile fields and avatar storage

alter table public.profiles
  add column if not exists guardian_title text default 'Tutor e guardiao de memorias',
  add column if not exists bio text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-photos', 'profile-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload profile photos" on storage.objects;
drop policy if exists "Users update profile photos" on storage.objects;
drop policy if exists "Users read public profile photos" on storage.objects;

create policy "Users upload profile photos"
  on storage.objects for insert
  with check (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update profile photos"
  on storage.objects for update
  using (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users read public profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');
