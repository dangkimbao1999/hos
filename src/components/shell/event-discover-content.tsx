"use client";

import { FilterPill } from "@/components/shell/filter-pill";
import { HashtagFilter } from "@/components/shell/hashtag-filter";
import { TimeRangeFilter } from "@/components/shell/time-range-filter";
import { EventListingCard } from "@/components/shell/event-listing-card";
import { mockUpcomingEvents, mockRecentEvents } from "@/lib/mock-event-listings";
import { mockEventDetail } from "@/lib/mock-event-detail";
import type { Role } from "@/lib/nav-items";

export function EventDiscoverContent({ role }: { role: Role }) {
  const results = [...mockUpcomingEvents, ...mockRecentEvents];
  const eventHref = `/${role}/events/${mockEventDetail.slug}`;

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
        {results.map((item, i) => (
          <EventListingCard key={`${item.id}-${i}`} data={item} href={eventHref} />
        ))}
      </div>
    </div>
  );
}
