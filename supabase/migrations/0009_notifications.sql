-- Notifications are derived at query time from existing tables (same
-- pattern as Schedule/Billing) rather than fanned out into a dedicated
-- table via triggers — there's no new domain concept here, just "recent
-- status changes on things you own." That requires knowing *when* a status
-- last changed, which event_applications/package_bookings didn't track.

alter table public.event_applications add column updated_at timestamptz not null default now();
alter table public.package_bookings add column updated_at timestamptz not null default now();

create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger event_applications_set_updated_at
  before update on public.event_applications
  for each row execute function public.set_updated_at();

create trigger package_bookings_set_updated_at
  before update on public.package_bookings
  for each row execute function public.set_updated_at();

-- "Unread" is computed client-side as event_time > notifications_read_at,
-- so all we need to persist is when the user last opened the panel.
alter table public.profiles add column notifications_read_at timestamptz;
