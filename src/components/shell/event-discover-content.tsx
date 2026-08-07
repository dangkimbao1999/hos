"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FilterPill } from "@/components/shell/filter-pill";
import { TimeRangeFilter, type DateRange } from "@/components/shell/time-range-filter";
import { EventListingCard } from "@/components/shell/event-listing-card";
import type { Role } from "@/lib/nav-items";
import type { CategoryOption, EventListingSummary } from "@/lib/supabase/types";

const SORTS = ["Most Popular", "Newest", "Price: Low to High", "Price: High to Low"];

export function EventDiscoverContent({
  role,
  listings,
  categories,
}: {
  role: Role;
  listings: EventListingSummary[];
  categories: CategoryOption[];
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

  const results = useMemo(() => {
    const query = searchQuery?.trim().toLowerCase();
    return listings
      .filter((event) => {
        if (query) {
          // A keyword search from the header searches across every category.
          return event.name.toLowerCase().includes(query);
        }
        return category === "All" || event.categories.includes(category);
      })
      .filter((event) => {
        if (!dateRange.start || !dateRange.end) return true;
        return event.event_date >= dateRange.start && event.event_date <= dateRange.end;
      })
      .sort((a, b) => {
        if (sort === "Price: Low to High") return (a.budget_min_vnd ?? 0) - (b.budget_min_vnd ?? 0);
        if (sort === "Price: High to Low") return (b.budget_min_vnd ?? 0) - (a.budget_min_vnd ?? 0);
        // "Most Popular" has no real signal to sort by (no ratings data yet) — falls back to Newest.
        return b.created_at.localeCompare(a.created_at);
      });
  }, [listings, category, sort, dateRange, searchQuery]);

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
        {results.map((item) => (
          <EventListingCard key={item.id} data={item} href={`/${role}/events/${item.slug}`} />
        ))}
      </div>
    </div>
  );
}
