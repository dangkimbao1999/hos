-- Raise the event photo cap from 3 to 10 to match the create-event wizard.
alter table public.events
  drop constraint event_photo_urls_max_3;

alter table public.events
  add constraint event_photo_urls_max_10
  check (array_length(photo_urls, 1) is null or array_length(photo_urls, 1) <= 10);
