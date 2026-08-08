import { afterEach, describe, expect, it, mock } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { EventDiscoverCursor, EventDiscoverFilters } from "@/lib/supabase/types";

let mockSearchParams = new URLSearchParams();
mock.module("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// Next's own <Link> prefetching also constructs a real IntersectionObserver
// (one per rendered card), so capturing "the" callback globally would race
// with those — key by observed element instead, so only the load-more
// sentinel's own callback is ever looked up.
type IntersectionCallback = (entries: { isIntersecting: boolean }[]) => void;
const intersectionCallbacksByTarget = new Map<Element, IntersectionCallback>();
class FakeIntersectionObserver {
  private cb: IntersectionCallback;
  constructor(cb: IntersectionCallback) {
    this.cb = cb;
  }
  observe(target: Element) {
    intersectionCallbacksByTarget.set(target, this.cb);
  }
  unobserve(target: Element) {
    intersectionCallbacksByTarget.delete(target);
  }
  disconnect() {}
}
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIntersectionObserver;

async function triggerSentinelIntersection() {
  const sentinel = screen.getByTestId("event-discover-load-more-sentinel");
  await act(async () => {
    intersectionCallbacksByTarget.get(sentinel)?.([{ isIntersecting: true }]);
  });
}

let fetchCalls: { filters: EventDiscoverFilters; cursor: EventDiscoverCursor | null }[] = [];
let fetchResponses: { listings: EventListingSummary[]; hasMore: boolean }[] = [];
mock.module("@/lib/supabase/event-discover-actions", () => ({
  fetchEventListings: async (filters: EventDiscoverFilters, cursor: EventDiscoverCursor | null) => {
    fetchCalls.push({ filters, cursor });
    return fetchResponses.shift() ?? { listings: [], hasMore: false };
  },
}));

import { EventDiscoverContent } from "@/components/shell/event-discover-content";
import type { CategoryOption, EventListingSummary } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  mockSearchParams = new URLSearchParams();
  intersectionCallbacksByTarget.clear();
  fetchCalls = [];
  fetchResponses = [];
});

function makeListing(overrides: Partial<EventListingSummary> = {}): EventListingSummary {
  return {
    id: "event-1",
    slug: "test-event",
    name: "Test Event",
    venue: "Test Venue",
    address: "123 Test St",
    event_date: "2026-09-01",
    start_time: "20:00",
    end_time: "22:00",
    status: "upcoming",
    organizer_id: "org-1",
    created_at: "2026-08-01T00:00:00Z",
    total_slots: 1,
    filled_slots: 0,
    budget_min_vnd: null,
    budget_max_vnd: null,
    categories: ["DJ"],
    photo_urls: [],
    ...overrides,
  };
}

const CATEGORIES: CategoryOption[] = [
  { id: "cat-dj", name: "DJ", subcategories: [] },
  { id: "cat-band", name: "Band", subcategories: [] },
];

function renderEventDiscover(overrides: Partial<Parameters<typeof EventDiscoverContent>[0]> = {}) {
  return render(
    <EventDiscoverContent
      role="talent"
      categories={CATEGORIES}
      initialListings={[]}
      initialHasMore={false}
      {...overrides}
    />
  );
}

describe("EventDiscoverContent — initial render", () => {
  it("shows initialListings without calling fetchEventListings", () => {
    renderEventDiscover({ initialListings: [makeListing({ id: "event-dj", name: "DJ Event" })] });
    expect(screen.getByText("DJ Event")).toBeInTheDocument();
    expect(fetchCalls).toEqual([]);
  });
});

describe("EventDiscoverContent — filter changes trigger a refetch", () => {
  it("picking a category from the FilterPill fetches with that category and replaces the list", async () => {
    fetchResponses = [{ listings: [makeListing({ id: "event-band", name: "Band Event" })], hasMore: false }];
    renderEventDiscover({ initialListings: [makeListing({ id: "event-dj", name: "DJ Event" })] });
    expect(screen.getByText("DJ Event")).toBeInTheDocument();

    const trigger = screen.getByText("Category").closest("button")!;
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText("Band"));

    await waitFor(() => {
      expect(screen.getByText("Band Event")).toBeInTheDocument();
    });
    expect(screen.queryByText("DJ Event")).not.toBeInTheDocument();
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.filters.category).toBe("Band");
    expect(fetchCalls[0]?.cursor).toBeNull();
  });

  it("resolves the search filter from ?q=, ignoring the category tab", async () => {
    mockSearchParams = new URLSearchParams("q=summer");
    fetchResponses = [{ listings: [makeListing({ id: "event-summer", name: "Summer Fest" })], hasMore: false }];
    renderEventDiscover({ initialListings: [makeListing({ id: "event-dj", name: "DJ Event" })] });

    const trigger = screen.getByText("Category").closest("button")!;
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText("Band"));

    await waitFor(() => {
      expect(fetchCalls).toHaveLength(1);
    });
    expect(fetchCalls[0]?.filters.search).toBe("summer");
  });
});

describe("EventDiscoverContent — infinite scroll", () => {
  it("scrolling the sentinel into view loads the next page and appends it", async () => {
    const first = makeListing({ id: "event-1", name: "Event One", created_at: "2026-08-01T00:00:00Z", budget_min_vnd: 2_000_000 });
    fetchResponses = [{ listings: [makeListing({ id: "event-2", name: "Event Two" })], hasMore: false }];
    renderEventDiscover({ initialListings: [first], initialHasMore: true });
    expect(screen.getByText("Event One")).toBeInTheDocument();

    await triggerSentinelIntersection();

    await waitFor(() => {
      expect(screen.getByText("Event Two")).toBeInTheDocument();
    });
    expect(screen.getByText("Event One")).toBeInTheDocument();
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.cursor).toEqual({ createdAt: "2026-08-01T00:00:00Z", budgetMin: 2_000_000, id: "event-1" });
  });

  it("does not render a sentinel (and never fetches) once hasMore is false", () => {
    renderEventDiscover({ initialListings: [makeListing()], initialHasMore: false });
    expect(screen.queryByTestId("event-discover-load-more-sentinel")).not.toBeInTheDocument();
    expect(fetchCalls).toEqual([]);
  });
});
