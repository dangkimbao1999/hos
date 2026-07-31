"use client";

import { FilterPill } from "@/components/shell/filter-pill";
import { HashtagFilter } from "@/components/shell/hashtag-filter";
import { TimeRangeFilter } from "@/components/shell/time-range-filter";
import { EventListingCard } from "@/components/shell/event-listing-card";
import type { EventListingSummary } from "@/lib/supabase/types";
import type { Role } from "@/lib/nav-items";

export function EventDiscoverContent({ role, listings }: { role: Role; listings: EventListingSummary[] }) {
  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">Discover all Events</h1>
        <p className="text-sm text-muted-foreground">Use filter for better search experience</p>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto">
        <FilterPill label="Sort by" defaultValue="Most Popular" options={["Most Popular", "Newest", "Price: Low to High", "Price: High to Low"]} />
        <FilterPill label="Category" defaultValue="All" options={["All", "Solo Singer", "Band", "Dancer", "Instrument", "DJ", "Stylish", "Make-up", "Bartender"]} />
        <FilterPill label="Location" defaultValue="HCM City" options={["HCM City", "Hanoi", "Da Nang"]} />
        <TimeRangeFilter />
        <HashtagFilter />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,289px)] gap-6 pt-4">
        {listings.map((item) => (
          <EventListingCard key={item.id} data={item} href={`/${role}/events/${item.slug}`} />
        ))}
      </div>
    </div>
  );
}
