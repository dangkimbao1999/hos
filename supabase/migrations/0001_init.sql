-- Profiles: one row per auth.users row, created automatically on sign-up.
create type public.role_type as enum ('organizer', 'talent', 'agency');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.role_type not null,
  full_name text not null default '',
  avatar_url text,
  bio text,
  location text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles are public marketplace listings (organizers browse talent/agency
-- profiles, talent/agency browse event organizers) — readable by anyone.
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Row-level RLS can't restrict individual columns, so an UPDATE policy alone
-- would let a user promote themselves (talent -> agency, etc). Block that in
-- a trigger instead, while still allowing the service role (used by trusted
-- server-side jobs) to change it.
create function public.prevent_role_change()
returns trigger as $$
begin
  if new.role <> old.role and auth.role() <> 'service_role' then
    raise exception 'role cannot be changed after account creation';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- Auto-create the profile row when a new auth user signs up. `role` and
-- `full_name` come from the metadata passed to supabase.auth.signUp().
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'organizer')::public.role_type,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage: avatar uploads, one file per user under `<user id>/...`.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
