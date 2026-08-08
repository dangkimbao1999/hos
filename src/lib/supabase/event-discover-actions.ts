"use server";

import { EVENT_DISCOVER_PAGE_SIZE, searchEventListings } from "@/lib/supabase/events";
import type { EventDiscoverCursor, EventDiscoverFilters, EventListingSummary } from "@/lib/supabase/types";

/** One page of the agency/talent Events Discover grid — call again with the returned cursor to load 15 more. */
export async function fetchEventListings(
  filters: EventDiscoverFilters,
  cursor: EventDiscoverCursor | null
): Promise<{ listings: EventListingSummary[]; hasMore: boolean }> {
  const listings = await searchEventListings(filters, cursor, EVENT_DISCOVER_PAGE_SIZE);
  return { listings, hasMore: listings.length === EVENT_DISCOVER_PAGE_SIZE };
}
