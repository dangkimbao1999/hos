-- Order Detail + Confirm/Counter-offer: a booking needs a live negotiation
-- state (separate talent/organizer asking prices, whose turn it is to
-- respond) instead of the single price_vnd + pending/confirmed/cancelled it
-- has today. Packages also need the extra display fields the Order Detail
-- panel shows (address, working method, skill requirement tags).

alter table public.packages
  add column address text,
  add column working_method text,
  add column skill_tags text[] not null default '{}';

alter table public.package_bookings
  add column talent_offer_vnd bigint,
  add column organizer_offer_vnd bigint,
  add column awaiting_response_from text check (awaiting_response_from in ('talent', 'organizer'));

-- Backfill: every existing booking's price_vnd was the organizer's opening
-- offer at checkout, mirrored as the starting point for both sides — the
-- talent already owed the first response under the old pending/confirmed
-- model, so that's preserved as whose turn it is next.
update public.package_bookings
set talent_offer_vnd = price_vnd,
    organizer_offer_vnd = price_vnd,
    awaiting_response_from = case when status = 'pending' then 'talent' else null end;

alter table public.package_bookings
  alter column talent_offer_vnd set not null,
  alter column organizer_offer_vnd set not null;

-- 'dealing': a counter-offer is outstanding, waiting on the other party.
alter table public.package_bookings drop constraint package_bookings_status_check;
alter table public.package_bookings add constraint package_bookings_status_check
  check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'dealing'));

-- The organizer previously had no UPDATE policy at all on package_bookings —
-- only the owning talent could act on a booking. Now either party can be
-- the one who needs to confirm/counter/cancel, so both need update access;
-- the server actions enforce whose turn it actually is.
drop policy "The owning talent can accept or reject a booking" on public.package_bookings;

create policy "The owning talent can update their bookings"
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

create policy "The organizer can update their bookings"
  on public.package_bookings for update
  to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));
