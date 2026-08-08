"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CategoryTabs } from "@/components/shell/category-tabs";
import { FilterPill } from "@/components/shell/filter-pill";
import { HashtagFilter } from "@/components/shell/hashtag-filter";
import { PriceRangeFilter, PRICE_FILTER_MAX } from "@/components/shell/price-range-filter";
import { TimeRangeFilter, type DateRange } from "@/components/shell/time-range-filter";
import { SearchResultCard } from "@/components/shell/listing-card";
import { fetchDiscoverPackages } from "@/lib/supabase/discover-actions";
import type { Role } from "@/lib/nav-items";
import type {
  CategoryOption,
  DiscoverCursor,
  DiscoverFilters,
  DiscoverSort,
  LookupOption,
  PackageWithTalent,
} from "@/lib/supabase/types";

const SORTS = ["Most Popular", "Newest", "Price: Low to High", "Price: High to Low"];
// "Most Popular" has no real signal to sort by (no ratings/booking-count data yet) — falls back to Newest,
// same as search_discover_packages()'s own fallback for any sort key other than the two price ones.
const SORT_TO_KEY: Record<string, DiscoverSort> = {
  "Most Popular": "newest",
  Newest: "newest",
  "Price: Low to High": "price_asc",
  "Price: High to Low": "price_desc",
};

// The price slider's onValueChange fires continuously while dragging — debounce so that doesn't
// fire a server request per pixel.
const FILTER_DEBOUNCE_MS = 300;

export function toCardData(pkg: PackageWithTalent) {
  return {
    id: pkg.id,
    title: pkg.talent_name,
    category: pkg.subcategory_name ? `${pkg.category_name} · ${pkg.subcategory_name}` : pkg.category_name,
    avatarUrl: pkg.talent_avatar_url,
    priceMin: pkg.price_min_vnd,
    priceMax: pkg.price_max_vnd,
    currency: "VND" as const,
  };
}

function cursorOf(pkg: PackageWithTalent | undefined): DiscoverCursor | null {
  return pkg ? { createdAt: pkg.created_at, priceMin: pkg.price_min_vnd, id: pkg.id } : null;
}

export function DiscoverContent({
  role,
  categories,
  cities,
  hashtagSuggestions,
  initialPackages,
  initialHasMore,
}: {
  role: Role;
  categories: CategoryOption[];
  cities: LookupOption[];
  hashtagSuggestions: string[];
  initialPackages: PackageWithTalent[];
  initialHasMore: boolean;
}) {
  const searchParams = useSearchParams();
  const categoryLabels = categories.map((c) => c.name);
  const categoryFromUrl = searchParams.get("category");
  const subcategoryFromUrl = searchParams.get("subcategory");
  const searchQuery = searchParams.get("q");
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl ?? categoryLabels[0]);
  const [subCategory, setSubCategory] = useState(subcategoryFromUrl ?? "All");
  const [location, setLocation] = useState("All");
  const [sort, setSort] = useState(SORTS[0]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_FILTER_MAX]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  // Sidebar category links navigate to this same route with new query params
  // rather than remounting the page, so the initial useState above only
  // covers first load. Adjust state during render (React's documented
  // pattern for "reset state when a prop changes") instead of an effect,
  // so a new sidebar click resyncs before the stale-category frame paints.
  const categoryKey = `${categoryFromUrl ?? ""}|${subcategoryFromUrl ?? ""}`;
  const [prevCategoryKey, setPrevCategoryKey] = useState(categoryKey);
  if (categoryKey !== prevCategoryKey) {
    setPrevCategoryKey(categoryKey);
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
      setSubCategory(subcategoryFromUrl ?? "All");
    }
  }

  const LOCATIONS = ["All", ...cities.map((c) => c.name)];
  const subCategoryOptions = [
    "All",
    ...(categories.find((c) => c.name === activeCategory)?.subcategories.map((s) => s.name) ?? []),
  ];

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setSubCategory("All");
  }

  // initialPackages/initialHasMore only ever seed the very first render. Every
  // change after that — including a sidebar-nav categoryKey change above — goes
  // through the single unified fetch below, which always sends the complete
  // current filter set. Re-using fresh SSR props on every prop update would
  // silently drop whichever client-only filters (location/price/hashtags/date)
  // the user already had selected, since page.tsx only knows the URL filters.
  const [packages, setPackages] = useState(initialPackages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);
  const isFirstRunRef = useRef(true);

  const filters = useMemo<DiscoverFilters>(() => {
    const category = categories.find((c) => c.name === activeCategory) ?? null;
    const subcategory =
      subCategory !== "All" ? (category?.subcategories.find((s) => s.name === subCategory) ?? null) : null;
    const city = location !== "All" ? (cities.find((c) => c.name === location) ?? null) : null;
    return {
      categoryId: category?.id ?? null,
      subcategoryId: subcategory?.id ?? null,
      cityId: city?.id ?? null,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      hashtags,
      dateStart: dateRange.start,
      dateEnd: dateRange.end,
      search: searchQuery?.trim() || null,
      sort: SORT_TO_KEY[sort],
    };
  }, [categories, cities, activeCategory, subCategory, location, priceRange, hashtags, dateRange, searchQuery, sort]);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      const result = await fetchDiscoverPackages(filters, null);
      if (requestId !== requestIdRef.current) return;
      setPackages(result.packages);
      setHasMore(result.hasMore);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  // Kept fresh every render (no dep array) so the IntersectionObserver below —
  // which only attaches once per sentinel mount — always calls the latest
  // closure over packages/hasMore/filters instead of a stale first-render one.
  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = async () => {
      if (isLoadingMore || !hasMore) return;
      const requestId = ++requestIdRef.current;
      setIsLoadingMore(true);
      const result = await fetchDiscoverPackages(filters, cursorOf(packages[packages.length - 1]));
      setIsLoadingMore(false);
      if (requestId !== requestIdRef.current) return;
      setPackages((prev) => [...prev, ...result.packages]);
      setHasMore(result.hasMore);
    };
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMoreRef.current();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  const countLabel = `${String(packages.length).padStart(2, "0")}${hasMore ? "+" : ""}`;
  const resultWord = !hasMore && packages.length === 1 ? "result" : "results";

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
          We found {countLabel} {resultWord} matching your filters
        </h1>
        <p className="text-sm text-muted-foreground">Use filter for better search experience</p>
      </div>

      <CategoryTabs categories={categoryLabels} active={activeCategory} onChange={handleCategoryChange} />

      <div className="scrollbar-hide flex gap-3 overflow-x-auto">
        <FilterPill label="Sort by" options={SORTS} value={sort} onChange={setSort} />
        <FilterPill label="Sub-Category" options={subCategoryOptions} value={subCategory} onChange={setSubCategory} />
        <FilterPill label="Location" options={LOCATIONS} value={location} onChange={setLocation} />
        <PriceRangeFilter range={priceRange} onChange={setPriceRange} />
        <TimeRangeFilter range={dateRange} onChange={setDateRange} />
        <HashtagFilter selected={hashtags} onChange={setHashtags} suggestions={hashtagSuggestions} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,289px)] gap-6 pt-4">
        {packages.map((pkg) => (
          <SearchResultCard key={pkg.id} data={toCardData(pkg)} href={`/${role}/talents/${pkg.talent_slug}`} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} data-testid="discover-load-more-sentinel" className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
