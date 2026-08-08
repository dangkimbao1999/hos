-- Keyset-paginated search for the agency/talent Events Discover grid — same
-- rationale as search_discover_packages(): pagination advances via a cursor
-- (last row's sort key + id) instead of OFFSET, so "load 15 more" stays a
-- cheap indexable range scan no matter how deep the user has scrolled.
create or replace function public.search_event_listings(
  p_category text default null,
  p_date_start date default null,
  p_date_end date default null,
  p_search text default null,
  p_sort text default 'newest',
  p_cursor_created_at timestamptz default null,
  p_cursor_budget_min bigint default null,
  p_cursor_id uuid default null,
  p_limit int default 15
)
returns setof public.event_listing_summary
language sql
stable
as $$
  select els.*
  from public.event_listing_summary els
  where els.status = 'upcoming'
    and (p_search is null or els.name ilike '%' || p_search || '%')
    and (p_search is not null or p_category is null or p_category = 'All' or p_category = any(els.categories))
    and (p_date_start is null or p_date_end is null or (els.event_date >= p_date_start and els.event_date <= p_date_end))
    and (
      p_cursor_id is null
      or (p_sort = 'price_asc' and (coalesce(els.budget_min_vnd, 0), els.id) > (coalesce(p_cursor_budget_min, 0), p_cursor_id))
      or (p_sort = 'price_desc' and (coalesce(els.budget_min_vnd, 0), els.id) < (coalesce(p_cursor_budget_min, 0), p_cursor_id))
      or (p_sort not in ('price_asc', 'price_desc') and (els.created_at, els.id) < (p_cursor_created_at, p_cursor_id))
    )
  order by
    case when p_sort = 'price_asc' then coalesce(els.budget_min_vnd, 0) end asc,
    case when p_sort = 'price_asc' then els.id end asc,
    case when p_sort = 'price_desc' then coalesce(els.budget_min_vnd, 0) end desc,
    case when p_sort = 'price_desc' then els.id end desc,
    case when p_sort not in ('price_asc', 'price_desc') then els.created_at end desc,
    case when p_sort not in ('price_asc', 'price_desc') then els.id end desc
  limit p_limit;
$$;
