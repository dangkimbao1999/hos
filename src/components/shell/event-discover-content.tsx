"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FilterPill } from "@/components/shell/filter-pill";
import { TimeRangeFilter, type DateRange } from "@/components/shell/time-range-filter";
import { EventListingCard } from "@/components/shell/event-listing-card";
import { fetchEventListings } from "@/lib/supabase/event-discover-actions";
import type { Role } from "@/lib/nav-items";
import type { CategoryOption, EventDiscoverCursor, EventDiscoverFilters, EventDiscoverSort, EventListingSummary } from "@/lib/supabase/types";

const SORTS = ["Most Popular", "Newest", "Price: Low to High", "Price: High to Low"];
// "Most Popular" has no real signal to sort by (no ratings data yet) — falls back to Newest,
// same as search_event_listings()'s own fallback for any sort key other than the two price ones.
const SORT_TO_KEY: Record<string, EventDiscoverSort> = {
  "Most Popular": "newest",
  Newest: "newest",
  "Price: Low to High": "price_asc",
  "Price: High to Low": "price_desc",
};

// The debounce keeps a rapid run of filter changes from firing a server request per change.
const FILTER_DEBOUNCE_MS = 300;

function cursorOf(item: EventListingSummary | undefined): EventDiscoverCursor | null {
  return item ? { createdAt: item.created_at, budgetMin: item.budget_min_vnd ?? 0, id: item.id } : null;
}

export function EventDiscoverContent({
  role,
  categories,
  initialListings,
  initialHasMore,
}: {
  role: Role;
  categories: CategoryOption[];
  initialListings: EventListingSummary[];
  initialHasMore: boolean;
}) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  // Events are only ever tagged with top-level category names (event_slots
  // can't reference a subcategory) — a ?subcategory= from a sidebar link is
  // deliberately ignored, which naturally falls back to showing every event
  // in that subcategory's parent category.
  const searchQuery = searchParams.get("q");
  const CATEGORIES = ["All", ...categories.map((c) => c.name)];
  const [category, setCategory] = useState(
    categoryFromUrl && CATEGORIES.includes(categoryFromUrl) ? categoryFromUrl : CATEGORIES[0]
  );
  const [sort, setSort] = useState(SORTS[0]);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  // Sidebar category links navigate to this same route with a new query
  // param rather than remounting the page, so the initial useState above
  // only covers first load. Adjust state during render (React's documented
  // pattern for "reset state when a prop changes") instead of an effect,
  // so a new sidebar click resyncs before the stale-category frame paints.
  const [prevCategoryFromUrl, setPrevCategoryFromUrl] = useState(categoryFromUrl);
  if (categoryFromUrl !== prevCategoryFromUrl) {
    setPrevCategoryFromUrl(categoryFromUrl);
    if (categoryFromUrl && CATEGORIES.includes(categoryFromUrl)) setCategory(categoryFromUrl);
  }

  // initialListings/initialHasMore only ever seed the very first render. Every
  // change after that — including a sidebar-nav categoryFromUrl change above —
  // goes through the single unified fetch below, which always sends the
  // complete current filter set (see discover-content.tsx for the fuller
  // rationale — same pattern, just for events).
  const [listings, setListings] = useState(initialListings);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);
  const isFirstRunRef = useRef(true);

  const filters = useMemo<EventDiscoverFilters>(
    () => ({
      category: category === "All" ? null : category,
      dateStart: dateRange.start,
      dateEnd: dateRange.end,
      search: searchQuery?.trim() || null,
      sort: SORT_TO_KEY[sort],
    }),
    [category, dateRange, searchQuery, sort]
  );

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      const result = await fetchEventListings(filters, null);
      if (requestId !== requestIdRef.current) return;
      setListings(result.listings);
      setHasMore(result.hasMore);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  // Kept fresh every render (no dep array) so the IntersectionObserver below —
  // which only attaches once per sentinel mount — always calls the latest
  // closure over listings/hasMore/filters instead of a stale first-render one.
  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = async () => {
      if (isLoadingMore || !hasMore) return;
      const requestId = ++requestIdRef.current;
      setIsLoadingMore(true);
      const result = await fetchEventListings(filters, cursorOf(listings[listings.length - 1]));
      setIsLoadingMore(false);
      if (requestId !== requestIdRef.current) return;
      setListings((prev) => [...prev, ...result.listings]);
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

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">Discover all Events</h1>
        <p className="text-sm text-muted-foreground">Use filter for better search experience</p>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto">
        <FilterPill label="Sort by" options={SORTS} value={sort} onChange={setSort} />
        <FilterPill label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
        <TimeRangeFilter range={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,289px)] gap-6 pt-4">
        {listings.map((item) => (
          <EventListingCard key={item.id} data={item} href={`/${role}/events/${item.slug}`} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} data-testid="event-discover-load-more-sentinel" className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
