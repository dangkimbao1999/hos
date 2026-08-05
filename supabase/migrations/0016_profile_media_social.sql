-- Profile media (cover/thumbnails), social links, achievements, services,
-- and two new Talent-only Basic Information fields. Columns live on every
-- role's profile row; the app UI gates which ones are editable per role.
alter table public.profiles
  add column cover_url text,
  add column gallery_urls text[] not null default '{}',
  add column social_links jsonb not null default '[]',
  add column achievements jsonb not null default '[]',
  add column services text[] not null default '{}',
  add column date_of_birth date,
  add column genre text;

alter table public.profiles
  add constraint gallery_urls_max_5
  check (array_length(gallery_urls, 1) is null or array_length(gallery_urls, 1) <= 5);

-- Storage: cover + gallery images, multiple files per user under
-- `<user id>/...` — same layout convention as the `avatars` bucket.
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do nothing;

create policy "Profile media is publicly accessible"
  on storage.objects for select
  using (bucket_id = 'profile-media');

create policy "Users can upload their own profile media"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own profile media"
  on storage.objects for update
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own profile media"
  on storage.objects for delete
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
