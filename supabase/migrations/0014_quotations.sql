-- Private Quotation flow: an organizer requests a custom quote from one
-- specific talent, outside the public event/package model. Talent responds
-- with a price (or declines); organizer accepts/rejects the quote. This is
-- a self-contained negotiation — accepting a quote does not (yet) create a
-- package_booking / flow into Billing or Schedule.
create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  talent_id uuid not null references public.profiles (id) on delete cascade,
  event_name text not null,
  event_date date,
  venue text,
  description text,
  budget_min_vnd bigint,
  budget_max_vnd bigint,
  status text not null default 'pending' check (status in ('pending', 'quoted', 'accepted', 'rejected', 'declined')),
  quoted_price_vnd bigint,
  talent_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotations_organizer_id_idx on public.quotations (organizer_id);
create index quotations_talent_id_idx on public.quotations (talent_id);

create function public.set_quotations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_quotations_updated_at();

alter table public.quotations enable row level security;

create policy "Organizer and the talent can view their own quotation"
  on public.quotations for select
  to authenticated
  using (organizer_id = (select auth.uid()) or talent_id = (select auth.uid()));

create policy "Organizer can request a quote"
  on public.quotations for insert
  to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'organizer')
    and exists (select 1 from public.profiles p where p.id = talent_id and p.role = 'talent')
  );

-- Talent can move pending -> quoted/declined; organizer can move quoted -> accepted/rejected.
-- Combined into one policy (rather than two) to avoid Postgres evaluating
-- multiple permissive UPDATE policies per query. The app's own server
-- actions only ever touch the columns each side is meant to set
-- (quoted_price_vnd/talent_note/status for the talent; status alone for the
-- organizer) — RLS here scopes *which rows* each side can update, not which
-- columns, matching how package_bookings' accept/reject policies work.
create policy "Talent and organizer can update per allowed transition"
  on public.quotations for update
  to authenticated
  using (
    (talent_id = (select auth.uid()) and status = 'pending')
    or (organizer_id = (select auth.uid()) and status = 'quoted')
  )
  with check (
    (talent_id = (select auth.uid()) and status in ('quoted', 'declined'))
    or (organizer_id = (select auth.uid()) and status in ('accepted', 'rejected'))
  );
