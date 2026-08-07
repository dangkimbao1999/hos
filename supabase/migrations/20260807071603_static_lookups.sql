-- Static, admin-managed lookup tables for City, Category (max 2 levels),
-- and Genre — replacing free-text/hardcoded-array fields on profiles,
-- packages, and event_slots. Admins manage rows directly in the DB
-- (service_role bypasses RLS); everyone else gets read-only access.

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

alter table public.cities enable row level security;

create policy "Cities are publicly readable"
  on public.cities for select
  using (true);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

alter table public.genres enable row level security;

create policy "Genres are publicly readable"
  on public.genres for select
  using (true);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.categories (id)
);

-- Top-level names unique among themselves; child names unique within their parent.
create unique index categories_top_level_name_key on public.categories (name) where parent_id is null;
create unique index categories_child_name_key on public.categories (parent_id, name) where parent_id is not null;
create index categories_parent_id_idx on public.categories (parent_id);

-- A category whose own parent already has a parent would make a 3rd level —
-- reject it. Runs on every insert/update, including direct service_role
-- writes via Studio, since triggers aren't bypassed by RLS.
create or replace function public.enforce_category_depth()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.parent_id is not null and exists (
    select 1 from public.categories where id = new.parent_id and parent_id is not null
  ) then
    raise exception 'categories can only be nested 2 levels deep';
  end if;
  return new;
end;
$$;

create trigger categories_max_depth
  before insert or update on public.categories
  for each row execute function public.enforce_category_depth();

alter table public.categories enable row level security;

create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

-- Seed from today's hardcoded lists (discover-content.tsx's LOCATIONS,
-- nav-items.ts's talentCategories) so existing selects don't go empty.
insert into public.cities (name) values ('HCM City'), ('Hanoi'), ('Da Nang');

with top_level as (
  insert into public.categories (name) values
    ('Solo Singer'), ('Band'), ('Dancer'), ('Instrument'),
    ('DJ'), ('Stylish'), ('Make-up'), ('Bartender')
  returning id, name
)
insert into public.categories (name, parent_id)
select sub.name, top_level.id
from top_level
cross join lateral (
  values ('Rapper'), ('Ballad'), ('RnB'), ('Bolero')
) as sub(name)
where top_level.name = 'Solo Singer';

-- profiles: city/genre were genuinely free-typed, so they reset to null
-- rather than attempting a fuzzy match. category/subcategory are new —
-- the profile-page selects existed before but were never wired to persist.
alter table public.profiles
  add column city_id uuid references public.cities (id),
  add column genre_id uuid references public.genres (id),
  add column category_id uuid references public.categories (id),
  add column subcategory_id uuid references public.categories (id);

create index profiles_city_id_idx on public.profiles (city_id);
create index profiles_genre_id_idx on public.profiles (genre_id);
create index profiles_category_id_idx on public.profiles (category_id);
create index profiles_subcategory_id_idx on public.profiles (subcategory_id);

alter table public.profiles
  drop column location,
  drop column genre;

-- Throwaway dev test fixture whose location ("Test Venue - Saigon") was
-- inserted directly, bypassing the UI's location <select> — not a real
-- package, safe to drop in this dev-only project.
delete from public.packages where title = '[TEST] Acoustic Set';

-- packages: location/category/sub_category were already constrained to the
-- same hardcoded lists via <select> in the UI, so an exact-name backfill is
-- safe (not a fuzzy free-text match).
alter table public.packages
  add column city_id uuid references public.cities (id),
  add column category_id uuid references public.categories (id),
  add column subcategory_id uuid references public.categories (id);

update public.packages p
set city_id = c.id
from public.cities c
where c.name = p.location;

update public.packages p
set category_id = c.id
from public.categories c
where c.name = p.category and c.parent_id is null;

update public.packages p
set subcategory_id = c.id
from public.categories c
where c.name = p.sub_category and c.parent_id = p.category_id;

alter table public.packages
  alter column city_id set not null,
  alter column category_id set not null;

create index packages_city_id_idx on public.packages (city_id);
create index packages_category_id_idx on public.packages (category_id);
create index packages_subcategory_id_idx on public.packages (subcategory_id);

alter table public.packages
  drop column location,
  drop column category,
  drop column sub_category;

-- event_slots: category was already constrained to the same hardcoded
-- top-level list via <select>, so this is also a safe exact-name backfill.
alter table public.event_slots
  add column category_id uuid references public.categories (id);

update public.event_slots s
set category_id = c.id
from public.categories c
where c.name = s.category and c.parent_id is null;

alter table public.event_slots
  alter column category_id set not null;

create index event_slots_category_id_idx on public.event_slots (category_id);

-- event_listing_summary aggregated category *names* from event_slots.category
-- directly; redefine it against category_id BEFORE dropping that column,
-- since the old view still depends on it.
create or replace view public.event_listing_summary
with (security_invoker = true) as
select
  e.id,
  e.slug,
  e.name,
  e.venue,
  e.address,
  e.event_date,
  e.start_time,
  e.end_time,
  e.status,
  e.organizer_id,
  e.created_at,
  coalesce(sum(s.quantity_total), 0)::int as total_slots,
  coalesce((
    select count(*)::int from public.event_applications a
    join public.event_slots s2 on s2.id = a.slot_id
    where s2.event_id = e.id and a.status = 'accepted'
  ), 0) as filled_slots,
  e.budget_min_vnd,
  e.budget_max_vnd,
  coalesce(array_agg(distinct cat.name) filter (where cat.name is not null), '{}') as categories,
  e.photo_urls
from public.events e
left join public.event_slots s on s.event_id = e.id
left join public.categories cat on cat.id = s.category_id
group by e.id;

alter table public.event_slots
  drop column category;
