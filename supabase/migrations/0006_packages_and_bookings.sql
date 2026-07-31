-- Talent needs a public, URL-friendly identifier so an organizer can look
-- up a specific talent's profile page (the way events already have slugs).
alter table public.profiles add column slug text;

update public.profiles
set slug = lower(regexp_replace(coalesce(nullif(full_name, ''), 'user'), '[^a-zA-Z0-9]+', '-', 'g'))
  || '-' || substr(id::text, 1, 6)
where slug is null;

alter table public.profiles alter column slug set not null;
alter table public.profiles add constraint profiles_slug_key unique (slug);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_slug text;
begin
  base_slug := lower(regexp_replace(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'user'), '[^a-zA-Z0-9]+', '-', 'g'));
  insert into public.profiles (id, role, full_name, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'organizer')::public.role_type,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    base_slug || '-' || substr(new.id::text, 1, 6)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Packages: a talent's bookable listing. Organizers browse a talent's
-- profile and book one of these directly (via cart/checkout below).
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  sub_category text,
  title text not null,
  residency text,
  location text not null,
  repeat_on boolean not null default true,
  repeat_days text[],
  start_date date not null,
  end_date date not null,
  start_time time not null,
  end_time time not null,
  description text,
  price_min_vnd bigint not null,
  price_max_vnd bigint not null,
  payment_method text not null check (payment_method in ('Prepaid', 'Postpaid')),
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now()
);

create index packages_talent_id_idx on public.packages (talent_id);

alter table public.packages enable row level security;

create policy "Packages are publicly readable"
  on public.packages for select
  using (true);

create policy "Talents can create their own packages"
  on public.packages for insert
  to authenticated
  with check (
    (select auth.uid()) = talent_id
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'talent')
  );

create policy "Talents can update their own packages"
  on public.packages for update
  to authenticated
  using ((select auth.uid()) = talent_id)
  with check ((select auth.uid()) = talent_id);

create policy "Talents can delete their own packages"
  on public.packages for delete
  to authenticated
  using ((select auth.uid()) = talent_id);

-- Cart: an organizer's in-progress selection, before checkout submits it
-- as real booking requests.
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  package_id uuid not null references public.packages (id) on delete cascade,
  price_vnd bigint not null,
  booked_date date,
  booked_time time,
  created_at timestamptz not null default now()
);

create index cart_items_organizer_id_idx on public.cart_items (organizer_id);
create index cart_items_package_id_idx on public.cart_items (package_id);

alter table public.cart_items enable row level security;

create policy "Organizers manage their own cart"
  on public.cart_items for all
  to authenticated
  using ((select auth.uid()) = organizer_id)
  with check ((select auth.uid()) = organizer_id);

-- Package bookings: a real booking request against a talent's package,
-- pending until the talent accepts (review/accept UI is a follow-up —
-- this pass ships the data model and the organizer-side flow that creates
-- these rows).
create table public.package_bookings (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  price_vnd bigint not null,
  booked_date date,
  booked_time time,
  payment_method text not null check (payment_method in ('Prepaid', 'Postpaid')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index package_bookings_package_id_idx on public.package_bookings (package_id);
create index package_bookings_organizer_id_idx on public.package_bookings (organizer_id);

alter table public.package_bookings enable row level security;

create policy "Organizer and the owning talent can view a booking"
  on public.package_bookings for select
  to authenticated
  using (
    organizer_id = (select auth.uid())
    or exists (
      select 1 from public.packages pkg
      where pkg.id = package_id and pkg.talent_id = (select auth.uid())
    )
  );

create policy "Organizers can create bookings for themselves"
  on public.package_bookings for insert
  to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'organizer')
  );

create policy "The owning talent can accept or reject a booking"
  on public.package_bookings for update
  to authenticated
  using (
    exists (
      select 1 from public.packages pkg
      where pkg.id = package_id and pkg.talent_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.packages pkg
      where pkg.id = package_id and pkg.talent_id = (select auth.uid())
    )
  );
