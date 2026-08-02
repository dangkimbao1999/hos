-- Expose each event's distinct slot categories on the listing summary so
-- Discover's Category filter has something real to filter on. An event can
-- have multiple slots (once multi-slot creation ships) with different
-- categories, hence an array rather than a single column.
create or replace view public.event_listing_summary
with (security_invoker = true) as
select
  e.id,
  e.slug,
  e.name,
  e.venue,
  e.address,
  e.event_date,
  e.start_time,
  e.end_time,
  e.status,
  e.organizer_id,
  e.created_at,
  coalesce(sum(s.quantity_total), 0)::int as total_slots,
  coalesce((
    select count(*)::int from public.event_applications a
    join public.event_slots s2 on s2.id = a.slot_id
    where s2.event_id = e.id and a.status = 'accepted'
  ), 0) as filled_slots,
  e.budget_min_vnd,
  e.budget_max_vnd,
  coalesce(array_agg(distinct s.category) filter (where s.category is not null), '{}') as categories
from public.events e
left join public.event_slots s on s.event_id = e.id
group by e.id;
