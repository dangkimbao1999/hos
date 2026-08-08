-- Date-windowed fetch for the Schedule page. Unlike the account list views
-- (Orders/Packages/Quotations/Events), this deliberately has no LIMIT or
-- total count: a personal schedule's row count within any given date window
-- is inherently small (bounded by reality — nobody has thousands of
-- confirmed engagements crammed into a few weeks), so the date range itself
-- is the bound. The caller (listScheduleEntries) is expected to pass a
-- window sized for what it's displaying, not "everything ever".
create or replace function public.list_schedule_entries(
  p_profile_id uuid,
  p_role text,
  p_date_start date,
  p_date_end date
)
returns table (
  title text,
  venue text,
  date date,
  start_time time,
  end_time time
)
language sql
stable
as $$
  -- Organizer: one row per accepted applicant on an event they created.
  select
    (applicant.full_name || ' — ' || coalesce(cat.name, '')) as title,
    e.venue,
    e.event_date as date,
    e.start_time,
    e.end_time
  from public.event_applications ea
  join public.event_slots es on es.id = ea.slot_id
  join public.events e on e.id = es.event_id
  join public.profiles applicant on applicant.id = ea.applicant_profile_id
  left join public.categories cat on cat.id = es.category_id
  where p_role = 'organizer'
    and e.organizer_id = p_profile_id
    and ea.status = 'accepted'
    and e.event_date between p_date_start and p_date_end

  union all

  -- Organizer: their own confirmed package bookings.
  select
    pkg.title,
    city.name,
    coalesce(pb.booked_date, pkg.start_date) as date,
    coalesce(pb.booked_time, pkg.start_time),
    pkg.end_time
  from public.package_bookings pb
  join public.packages pkg on pkg.id = pb.package_id
  left join public.cities city on city.id = pkg.city_id
  where p_role = 'organizer'
    and pb.organizer_id = p_profile_id
    and pb.status = 'confirmed'
    and coalesce(pb.booked_date, pkg.start_date) between p_date_start and p_date_end

  union all

  -- Talent: events they're an accepted applicant on.
  select
    (e.name || ' — ' || coalesce(cat.name, '')) as title,
    e.venue,
    e.event_date as date,
    e.start_time,
    e.end_time
  from public.event_applications ea
  join public.event_slots es on es.id = ea.slot_id
  join public.events e on e.id = es.event_id
  left join public.categories cat on cat.id = es.category_id
  where p_role = 'talent'
    and ea.applicant_profile_id = p_profile_id
    and ea.status = 'accepted'
    and e.event_date between p_date_start and p_date_end

  union all

  -- Talent: confirmed bookings on their own packages.
  select
    (organizer.full_name || ' — ' || pkg.title) as title,
    city.name,
    coalesce(pb.booked_date, pkg.start_date) as date,
    coalesce(pb.booked_time, pkg.start_time),
    pkg.end_time
  from public.package_bookings pb
  join public.packages pkg on pkg.id = pb.package_id
  join public.profiles organizer on organizer.id = pb.organizer_id
  left join public.cities city on city.id = pkg.city_id
  where p_role = 'talent'
    and pkg.talent_id = p_profile_id
    and pb.status = 'confirmed'
    and coalesce(pb.booked_date, pkg.start_date) between p_date_start and p_date_end

  order by date, start_time;
$$;
