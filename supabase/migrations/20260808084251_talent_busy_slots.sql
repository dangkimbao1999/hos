-- Schedule collision avoidance: an organizer browsing a talent's page needs
-- to see (and be blocked from double-booking into) that talent's EXISTING
-- confirmed engagements -- even ones booked by a different organizer, which
-- RLS on package_bookings/event_applications otherwise correctly hides from
-- them (those rows carry price, negotiation state, and the other
-- organizer's identity, none of which should leak).
--
-- SECURITY DEFINER is the deliberate tool here: it bypasses the caller's
-- RLS to read across all organizers' bookings for this one talent, but the
-- function body is fixed and only ever returns (date, start_time,
-- end_time) -- no price, no organizer_id, no booking id. That's the
-- least-privilege slice callers actually need.
create or replace function public.get_talent_busy_slots(p_talent_id uuid)
returns table (busy_date date, start_time time, end_time time)
language sql
security definer
set search_path = ''
stable
as $$
  select pb.booked_date, pb.booked_time, pb.booked_end_time
  from public.package_bookings pb
  join public.packages pkg on pkg.id = pb.package_id
  where pkg.talent_id = p_talent_id
    and pb.status = 'confirmed'
    and pb.booked_date is not null
    and pb.booked_time is not null
    and pb.booked_end_time is not null

  union all

  select e.event_date, e.start_time, e.end_time
  from public.event_applications ea
  join public.event_slots es on es.id = ea.slot_id
  join public.events e on e.id = es.event_id
  where ea.applicant_profile_id = p_talent_id
    and ea.status = 'accepted';
$$;

-- Supabase's default privileges grant EXECUTE on new public-schema
-- functions directly to anon/authenticated/service_role (not via the
-- PUBLIC pseudo-role), so `revoke ... from public` alone doesn't touch
-- anon's access -- revoke it explicitly. This must stay authenticated-only.
revoke all on function public.get_talent_busy_slots(uuid) from public;
revoke all on function public.get_talent_busy_slots(uuid) from anon;
grant execute on function public.get_talent_busy_slots(uuid) to authenticated;
