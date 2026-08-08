-- Keyset-paginated search for the organizer Discover grid. Replaces
-- fetching every active package up front and filtering/sorting in JS:
-- the WHERE clause below reproduces that same filter logic in SQL, and
-- pagination advances via a cursor (last row's sort key + id) instead of
-- OFFSET, so a "load 15 more" scroll stays a cheap indexable range scan
-- no matter how deep the user has scrolled.
create or replace function public.search_discover_packages(
  p_category_id uuid default null,
  p_subcategory_id uuid default null,
  p_city_id uuid default null,
  p_price_min bigint default 0,
  p_price_max bigint default 5000000000,
  p_hashtags text[] default '{}',
  p_date_start date default null,
  p_date_end date default null,
  p_search text default null,
  p_sort text default 'newest',
  p_cursor_created_at timestamptz default null,
  p_cursor_price_min bigint default null,
  p_cursor_id uuid default null,
  p_limit int default 15
)
returns table (
  id uuid,
  talent_id uuid,
  category_id uuid,
  subcategory_id uuid,
  title text,
  residency text,
  city_id uuid,
  working_method text,
  skill_tags text[],
  repeat_on boolean,
  repeat_days text[],
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  description text,
  price_min_vnd bigint,
  price_max_vnd bigint,
  payment_method text,
  status text,
  is_most_popular boolean,
  is_editor_choice boolean,
  created_at timestamptz,
  talent_name text,
  talent_slug text,
  talent_keywords text[],
  talent_avatar_url text,
  talent_genre_name text,
  category_name text,
  subcategory_name text,
  city_name text
)
language sql
stable
as $$
  select
    pkg.id, pkg.talent_id, pkg.category_id, pkg.subcategory_id, pkg.title, pkg.residency,
    pkg.city_id, pkg.working_method, pkg.skill_tags, pkg.repeat_on, pkg.repeat_days,
    pkg.start_date, pkg.end_date, pkg.start_time, pkg.end_time, pkg.description,
    pkg.price_min_vnd, pkg.price_max_vnd, pkg.payment_method, pkg.status,
    pkg.is_most_popular, pkg.is_editor_choice, pkg.created_at,
    talent.full_name, talent.slug, talent.keywords, talent.avatar_url, genre.name,
    cat.name, subcat.name, city.name
  from public.packages pkg
  join public.profiles talent on talent.id = pkg.talent_id
  join public.categories cat on cat.id = pkg.category_id
  left join public.categories subcat on subcat.id = pkg.subcategory_id
  left join public.genres genre on genre.id = talent.genre_id
  join public.cities city on city.id = pkg.city_id
  where pkg.status = 'active'
    and (p_search is null or pkg.title ilike '%' || p_search || '%' or talent.full_name ilike '%' || p_search || '%')
    and (p_search is not null or p_category_id is null or pkg.category_id = p_category_id)
    and (p_search is not null or p_subcategory_id is null or pkg.subcategory_id = p_subcategory_id)
    and (p_city_id is null or pkg.city_id = p_city_id)
    and pkg.price_max_vnd >= p_price_min
    and pkg.price_min_vnd <= p_price_max
    and (cardinality(p_hashtags) = 0 or talent.keywords && p_hashtags)
    and (p_date_start is null or p_date_end is null or (pkg.end_date >= p_date_start and pkg.start_date <= p_date_end))
    and (
      p_cursor_id is null
      or (p_sort = 'price_asc' and (pkg.price_min_vnd, pkg.id) > (p_cursor_price_min, p_cursor_id))
      or (p_sort = 'price_desc' and (pkg.price_min_vnd, pkg.id) < (p_cursor_price_min, p_cursor_id))
      or (p_sort not in ('price_asc', 'price_desc') and (pkg.created_at, pkg.id) < (p_cursor_created_at, p_cursor_id))
    )
  order by
    case when p_sort = 'price_asc' then pkg.price_min_vnd end asc,
    case when p_sort = 'price_asc' then pkg.id end asc,
    case when p_sort = 'price_desc' then pkg.price_min_vnd end desc,
    case when p_sort = 'price_desc' then pkg.id end desc,
    case when p_sort not in ('price_asc', 'price_desc') then pkg.created_at end desc,
    case when p_sort not in ('price_asc', 'price_desc') then pkg.id end desc
  limit p_limit;
$$;
