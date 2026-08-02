"use client";

import { useMemo, useState } from "react";
import { FilterPill } from "@/components/shell/filter-pill";
import { HashtagFilter } from "@/components/shell/hashtag-filter";
import { TimeRangeFilter } from "@/components/shell/time-range-filter";
import { EventListingCard } from "@/components/shell/event-listing-card";
import { talentCategories, type Role } from "@/lib/nav-items";
import type { EventListingSummary } from "@/lib/supabase/types";

const CATEGORIES = ["All", ...talentCategories.map((c) => c.label)];
const SORTS = ["Most Popular", "Newest", "Price: Low to High", "Price: High to Low"];

export function EventDiscoverContent({ role, listings }: { role: Role; listings: EventListingSummary[] }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [sort, setSort] = useState(SORTS[0]);

  const results = useMemo(() => {
    return listings
      .filter((event) => category === "All" || event.categories.includes(category))
      .sort((a, b) => {
        if (sort === "Price: Low to High") return (a.budget_min_vnd ?? 0) - (b.budget_min_vnd ?? 0);
        if (sort === "Price: High to Low") return (b.budget_min_vnd ?? 0) - (a.budget_min_vnd ?? 0);
        // "Most Popular" has no real signal to sort by (no ratings data yet) — falls back to Newest.
        return b.created_at.localeCompare(a.created_at);
      });
  }, [listings, category, sort]);

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">Discover all Events</h1>
        <p className="text-sm text-muted-foreground">Use filter for better search experience</p>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto">
        <FilterPill label="Sort by" options={SORTS} value={sort} onChange={setSort} />
        <FilterPill label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
        <TimeRangeFilter />
        <HashtagFilter />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,289px)] gap-6 pt-4">
        {results.map((item) => (
          <EventListingCard key={item.id} data={item} href={`/${role}/events/${item.slug}`} />
        ))}
      </div>
    </div>
  );
}
