-- A package's start_time/end_time is the talent's availability WINDOW
-- (e.g. 9AM-6PM), not a fixed performance slot -- the organizer picks a
-- start time inside that window but must say how long they actually need
-- the talent for (e.g. 1 hour), which the package's own end_time can't
-- express. Same concept applies to a private quotation, which isn't tied
-- to any package at all and previously captured no time whatsoever.

alter table public.cart_items
  add column booked_end_time time;

alter table public.package_bookings
  add column booked_end_time time;

alter table public.quotations
  add column event_start_time time,
  add column event_end_time time;
