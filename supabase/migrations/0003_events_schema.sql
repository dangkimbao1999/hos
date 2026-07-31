-- Events: organizer-created listings. Each event has one or more slots
-- (a role needed, e.g. "Solo Singer"), and talent/agency profiles apply to
-- a specific slot via event_applications.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  name text not null,
  venue text not null,
  address text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  tagline text,
  description text,
  budget_min_vnd bigint,
  budget_max_vnd bigint,
  contact_phone text,
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index events_organizer_id_idx on public.events (organizer_id);
create index events_status_idx on public.events (status);
create index events_event_date_idx on public.events (event_date);

alter table public.events enable row level security;

create policy "Events are publicly readable"
  on public.events for select
  using (true);

create policy "Organizers can create their own events"
  on public.events for insert
  to authenticated
  with check (
    (select auth.uid()) = organizer_id
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'organizer')
  );

create policy "Organizers can update their own events"
  on public.events for update
  to authenticated
  using ((select auth.uid()) = organizer_id)
  with check ((select auth.uid()) = organizer_id);

create policy "Organizers can delete their own events"
  on public.events for delete
  to authenticated
  using ((select auth.uid()) = organizer_id);

-- Event slots

create table public.event_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  category text not null,
  price_usd numeric(12, 2) not null check (price_usd >= 0),
  slot_type text not null default 'Fulltime',
  quantity_total int not null check (quantity_total > 0),
  created_at timestamptz not null default now()
);

create index event_slots_event_id_idx on public.event_slots (event_id);

alter table public.event_slots enable row level security;

create policy "Event slots are publicly readable"
  on public.event_slots for select
  using (true);

create policy "Organizers can create slots on their own events"
  on public.event_slots for insert
  to authenticated
  with check (
    exists (select 1 from public.events e where e.id = event_id and e.organizer_id = (select auth.uid()))
  );

create policy "Organizers can update slots on their own events"
  on public.event_slots for update
  to authenticated
  using (
    exists (select 1 from public.events e where e.id = event_id and e.organizer_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.events e where e.id = event_id and e.organizer_id = (select auth.uid()))
  );

create policy "Organizers can delete slots on their own events"
  on public.event_slots for delete
  to authenticated
  using (
    exists (select 1 from public.events e where e.id = event_id and e.organizer_id = (select auth.uid()))
  );

-- Applications: a talent/agency profile applying to a specific slot.

create table public.event_applications (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.event_slots (id) on delete cascade,
  applicant_profile_id uuid not null references public.profiles (id) on delete cascade,
  offer_amount_usd numeric(12, 2),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (slot_id, applicant_profile_id)
);

create index event_applications_slot_id_idx on public.event_applications (slot_id);
create index event_applications_applicant_profile_id_idx on public.event_applications (applicant_profile_id);

alter table public.event_applications enable row level security;

create policy "Applicants and the event organizer can view applications"
  on public.event_applications for select
  to authenticated
  using (
    applicant_profile_id = (select auth.uid())
    or exists (
      select 1 from public.event_slots s
      join public.events e on e.id = s.event_id
      where s.id = slot_id and e.organizer_id = (select auth.uid())
    )
  );

create policy "Talent and agency profiles can apply to slots"
  on public.event_applications for insert
  to authenticated
  with check (
    applicant_profile_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('talent', 'agency')
    )
  );

create policy "The event organizer can accept or reject applications"
  on public.event_applications for update
  to authenticated
  using (
    exists (
      select 1 from public.event_slots s
      join public.events e on e.id = s.event_id
      where s.id = slot_id and e.organizer_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.event_slots s
      join public.events e on e.id = s.event_id
      where s.id = slot_id and e.organizer_id = (select auth.uid())
    )
  );

-- Guard against accepting more applications than a slot has room for —
-- RLS controls who can flip the status, this controls that the flip is
-- still valid regardless of who made it.
create function public.check_slot_capacity()
returns trigger as $$
declare
  total int;
  filled int;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    select quantity_total into total from public.event_slots where id = new.slot_id;
    select count(*) into filled from public.event_applications
      where slot_id = new.slot_id and status = 'accepted';
    if filled >= total then
      raise exception 'slot is already fully booked';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger event_applications_check_capacity
  before update on public.event_applications
  for each row execute function public.check_slot_capacity();

-- Read-shaped view for Discover/Home listing cards: total slot capacity vs
-- how many slots are filled (accepted applications), per event.
create view public.event_listing_summary
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
  ), 0) as filled_slots
from public.events e
left join public.event_slots s on s.event_id = e.id
group by e.id;
