-- The create-event wizard collects expected guest count and special
-- requirements, but 0003 didn't have columns for them yet.
alter table public.events
  add column expected_guests int,
  add column special_requirements text;
