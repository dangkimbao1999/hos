-- Proof + reminder: the talent can flag that the event happened, which
-- notifies the organizer and records a timestamp usable as evidence if a
-- dispute arises. It does NOT change package_bookings.status -- only the
-- organizer's own mark-complete action does that (status -> 'completed').
alter table public.package_bookings
  add column talent_marked_complete_at timestamptz;
