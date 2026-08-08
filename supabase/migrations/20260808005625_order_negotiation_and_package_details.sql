-- Order Detail + Confirm/Counter-offer: a booking needs a live negotiation
-- state (separate talent/organizer asking prices, whose turn it is to
-- respond) instead of the single price_vnd + pending/confirmed/cancelled it
-- has today. Packages also need the extra display fields the Order Detail
-- panel shows (working method, skill requirement tags) -- NOT address: a
-- package's city is just "where the talent is based," set once by the
-- talent. The actual perform address is specific to a given event, entered
-- by the organizer per request (quotation or package booking) -- see the
-- city_id/address columns added to quotations/cart_items/package_bookings
-- below.

alter table public.packages
  add column working_method text,
  add column skill_tags text[] not null default '{}';

alter table public.package_bookings
  add column talent_offer_vnd bigint,
  add column organizer_offer_vnd bigint,
  add column awaiting_response_from text check (awaiting_response_from in ('talent', 'organizer')),
  add column city_id uuid references public.cities (id),
  add column address text;

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

create index package_bookings_city_id_idx on public.package_bookings (city_id);

-- cart_items carries the same perform city/address so checkout can copy it
-- straight onto the package_booking it creates.
alter table public.cart_items
  add column city_id uuid references public.cities (id),
  add column address text;

create index cart_items_city_id_idx on public.cart_items (city_id);

-- Quotations: the organizer already free-typed a "venue" name -- city/address
-- are the actual required perform-location fields; venue stays optional
-- (e.g. a venue's proper name, distinct from its street address).
alter table public.quotations
  add column city_id uuid references public.cities (id),
  add column address text;

create index quotations_city_id_idx on public.quotations (city_id);
