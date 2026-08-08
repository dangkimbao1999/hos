import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, EventDiscoverFilters, EventListingSummary } from "@/lib/supabase/types";

const CATEGORIES: CategoryOption[] = [{ id: "cat-1", name: "DJ", subcategories: [] }];

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => CATEGORIES,
}));

let searchArgs: { filters: EventDiscoverFilters; cursor: unknown; limit: number } | null = null;
let searchResult: EventListingSummary[] = [];
mock.module("@/lib/supabase/events", () => ({
  EVENT_DISCOVER_PAGE_SIZE: 15,
  resolveInitialEventFilters: (categories: CategoryOption[], params: { category?: string; q?: string }) => ({
    category: params.category ?? null,
    dateStart: null,
    dateEnd: null,
    search: params.q ?? null,
    sort: "newest" as const,
  }),
  searchEventListings: async (filters: EventDiscoverFilters, cursor: unknown, limit: number) => {
    searchArgs = { filters, cursor, limit };
    return searchResult;
  },
}));

let eventDiscoverContentProps: Record<string, unknown> | null = null;
mock.module("@/components/shell/event-discover-content", () => ({
  EventDiscoverContent: (props: Record<string, unknown>) => {
    eventDiscoverContentProps = props;
    return <div data-testid="content" />;
  },
}));

import TalentDiscoverPage from "@/app/talent/discover/page";

function makeListing(id: string): EventListingSummary {
  return { id } as unknown as EventListingSummary;
}

describe("TalentDiscoverPage", () => {
  it("fetches categories and the first page, passing them to EventDiscoverContent", async () => {
    searchResult = [makeListing("event-1")];
    const jsx = await TalentDiscoverPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(eventDiscoverContentProps).toMatchObject({
      role: "talent",
      categories: CATEGORIES,
      initialListings: searchResult,
      initialHasMore: false,
    });
    expect(searchArgs).toMatchObject({ cursor: null, limit: 15 });
  });

  it("reports initialHasMore: true when the first page comes back full (15 rows)", async () => {
    searchResult = Array.from({ length: 15 }, (_, i) => makeListing(`event-${i}`));
    const jsx = await TalentDiscoverPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(eventDiscoverContentProps).toMatchObject({ initialHasMore: true });
  });

  it("resolves the category/search filters from the URL params", async () => {
    searchResult = [];
    await render(await TalentDiscoverPage({ searchParams: Promise.resolve({ category: "DJ", q: "gala" }) }));
    expect(searchArgs?.filters.category).toBe("DJ");
    expect(searchArgs?.filters.search).toBe("gala");
  });
});
