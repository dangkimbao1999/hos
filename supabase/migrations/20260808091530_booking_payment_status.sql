-- Tracks whether a confirmed booking's payment has been completed.
-- Prepaid bookings start 'pending' and are marked 'complete' once the
-- organizer confirms they've sent the bank transfer; Postpaid bookings are
-- set 'complete' at confirm time since payment happens after the event.
alter table public.package_bookings
  add column payment_status text not null default 'pending'
  check (payment_status in ('pending', 'complete'));
