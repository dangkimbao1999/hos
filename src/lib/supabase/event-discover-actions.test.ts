import { describe, expect, it, mock } from "bun:test";
import type { EventDiscoverFilters, EventListingSummary } from "@/lib/supabase/types";

let searchResult: EventListingSummary[] = [];
let searchArgs: { filters: EventDiscoverFilters; cursor: unknown; limit: number } | null = null;

mock.module("@/lib/supabase/events", () => ({
  EVENT_DISCOVER_PAGE_SIZE: 15,
  searchEventListings: async (filters: EventDiscoverFilters, cursor: unknown, limit: number) => {
    searchArgs = { filters, cursor, limit };
    return searchResult;
  },
}));

import { fetchEventListings } from "@/lib/supabase/event-discover-actions";

const FILTERS: EventDiscoverFilters = {
  category: null,
  dateStart: null,
  dateEnd: null,
  search: null,
  sort: "newest",
};

function makeListing(id: string): EventListingSummary {
  return { id } as unknown as EventListingSummary;
}

describe("fetchEventListings", () => {
  it("fetches a page of 15 and reports hasMore when a full page comes back", async () => {
    searchResult = Array.from({ length: 15 }, (_, i) => makeListing(`event-${i}`));
    const result = await fetchEventListings(FILTERS, null);
    expect(searchArgs).toMatchObject({ filters: FILTERS, cursor: null, limit: 15 });
    expect(result).toEqual({ listings: searchResult, hasMore: true });
  });

  it("reports hasMore: false when the page comes back short", async () => {
    searchResult = [makeListing("event-1")];
    const result = await fetchEventListings(FILTERS, null);
    expect(result).toEqual({ listings: searchResult, hasMore: false });
  });

  it("passes the given cursor through to searchEventListings", async () => {
    searchResult = [];
    const cursor = { createdAt: "2026-08-01T00:00:00Z", budgetMin: 1_000_000, id: "event-1" };
    await fetchEventListings(FILTERS, cursor);
    expect(searchArgs).toMatchObject({ cursor });
  });
});
