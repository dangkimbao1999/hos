-- Offset-paginated search for each role's My Orders page. Unlike the
-- Discover grids' keyset pagination (which deliberately avoids a count so a
-- scroll never pays for one), a numbered-page control genuinely needs a
-- total count to render "page 1 of N" — so count(*) over() here is the
-- right tool, computed once per page request.
create or replace function public.search_bookings_for_role(
  p_role text,
  p_profile_id uuid,
  p_status text default null,
  p_search text default null,
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  id uuid,
  package_id uuid,
  organizer_id uuid,
  price_vnd bigint,
  talent_offer_vnd bigint,
  organizer_offer_vnd bigint,
  awaiting_response_from text,
  booked_date date,
  booked_time time,
  booked_end_time time,
  city_id uuid,
  address text,
  payment_method text,
  status text,
  payment_status text,
  talent_marked_complete_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  package_title text,
  organizer_name text,
  talent_name text,
  total_count bigint
)
language sql
stable
as $$
  select
    b.id, b.package_id, b.organizer_id, b.price_vnd, b.talent_offer_vnd, b.organizer_offer_vnd,
    b.awaiting_response_from, b.booked_date, b.booked_time, b.booked_end_time, b.city_id, b.address,
    b.payment_method, b.status, b.payment_status, b.talent_marked_complete_at, b.created_at, b.updated_at,
    pkg.title, organizer.full_name, talent.full_name,
    count(*) over() as total_count
  from public.package_bookings b
  join public.packages pkg on pkg.id = b.package_id
  join public.profiles organizer on organizer.id = b.organizer_id
  join public.profiles talent on talent.id = pkg.talent_id
  where
    case p_role
      when 'organizer' then b.organizer_id = p_profile_id
      when 'talent' then pkg.talent_id = p_profile_id
      else false
    end
    and (
      p_status is null or p_status = 'All'
      or (p_status = 'Upcoming' and b.status = 'confirmed' and b.booked_date >= current_date)
      or (p_status not in ('All', 'Upcoming') and b.status = lower(p_status))
    )
    and (
      p_search is null or p_search = ''
      or (case when p_role = 'organizer' then talent.full_name else organizer.full_name end) ilike '%' || p_search || '%'
      or left(b.id::text, 8) ilike '%' || p_search || '%'
    )
  order by b.created_at desc
  limit p_limit offset p_offset;
$$;
