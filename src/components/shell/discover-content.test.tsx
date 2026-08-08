import { afterEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DiscoverCursor, DiscoverFilters } from "@/lib/supabase/types";

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
  const sentinel = screen.getByTestId("discover-load-more-sentinel");
  await act(async () => {
    intersectionCallbacksByTarget.get(sentinel)?.([{ isIntersecting: true }]);
  });
}

let fetchCalls: { filters: DiscoverFilters; cursor: DiscoverCursor | null }[] = [];
let fetchResponses: { packages: PackageWithTalent[]; hasMore: boolean }[] = [];
mock.module("@/lib/supabase/discover-actions", () => ({
  fetchDiscoverPackages: async (filters: DiscoverFilters, cursor: DiscoverCursor | null) => {
    fetchCalls.push({ filters, cursor });
    return fetchResponses.shift() ?? { packages: [], hasMore: false };
  },
}));

import { DiscoverContent, toCardData } from "@/components/shell/discover-content";
import type { CategoryOption, PackageWithTalent } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  mockSearchParams = new URLSearchParams();
  intersectionCallbacksByTarget.clear();
  fetchCalls = [];
  fetchResponses = [];
});

function makePackage(overrides: Partial<PackageWithTalent> = {}): PackageWithTalent {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category_id: "cat-solo-singer",
    subcategory_id: null,
    title: "My Package",
    residency: null,
    city_id: "city-hcm",
    working_method: null,
    skill_tags: [],
    repeat_on: true,
    repeat_days: null,
    start_date: "2026-08-01",
    end_date: "2026-12-31",
    start_time: "18:00:00",
    end_time: "22:00:00",
    description: null,
    price_min_vnd: 1_000_000,
    price_max_vnd: 5_000_000,
    payment_method: "Prepaid",
    status: "active",
    is_most_popular: false,
    is_editor_choice: false,
    created_at: "2026-08-01T00:00:00Z",
    talent_name: "Some Talent",
    talent_slug: "some-talent-abc123",
    talent_keywords: [],
    talent_avatar_url: null,
    talent_genre_name: null,
    category_name: "Solo Singer",
    subcategory_name: null,
    city_name: "HCM City",
    ...overrides,
  };
}

describe("toCardData", () => {
  test("uses the talent's name as the card title", () => {
    expect(toCardData(makePackage({ talent_name: "DJ Nova" })).title).toBe("DJ Nova");
  });

  test("combines category and subcategory when subcategory_name is set", () => {
    const card = toCardData(makePackage({ category_name: "Solo Singer", subcategory_name: "Rapper" }));
    expect(card.category).toBe("Solo Singer · Rapper");
  });

  test("carries the talent's real avatar url through", () => {
    const card = toCardData(makePackage({ talent_avatar_url: "https://example.com/avatar.jpg" }));
    expect(card.avatarUrl).toBe("https://example.com/avatar.jpg");
  });
});

const CATEGORIES: CategoryOption[] = [
  { id: "cat-solo", name: "Solo Singer", subcategories: [{ id: "cat-rapper", name: "Rapper" }] },
  { id: "cat-dj", name: "DJ", subcategories: [] },
];

function renderDiscover(overrides: Partial<Parameters<typeof DiscoverContent>[0]> = {}) {
  return render(
    <DiscoverContent
      role="organizer"
      categories={CATEGORIES}
      cities={[]}
      hashtagSuggestions={[]}
      initialPackages={[]}
      initialHasMore={false}
      {...overrides}
    />
  );
}

describe("DiscoverContent — initial render", () => {
  test("shows initialPackages without calling fetchDiscoverPackages", () => {
    const initialPackages = [makePackage({ id: "pkg-a", talent_name: "DJ Nova" })];
    renderDiscover({ initialPackages, initialHasMore: false });
    expect(screen.getByText("DJ Nova")).toBeInTheDocument();
    expect(fetchCalls).toEqual([]);
  });

  test("shows a '+' after the count while more results might exist", () => {
    renderDiscover({ initialPackages: [makePackage()], initialHasMore: true });
    expect(screen.getByText(/01\+ results/)).toBeInTheDocument();
  });

  test("shows an exact count with no '+' once every result has loaded", () => {
    renderDiscover({ initialPackages: [makePackage()], initialHasMore: false });
    expect(screen.getByText(/01 result\b/)).toBeInTheDocument();
  });
});

describe("DiscoverContent — filter changes trigger a refetch", () => {
  test("switching category tabs fetches with the new category and replaces the list", async () => {
    fetchResponses = [{ packages: [makePackage({ id: "pkg-dj", talent_name: "DJ Nova" })], hasMore: false }];
    renderDiscover({ initialPackages: [makePackage({ id: "pkg-solo", talent_name: "Solo Star" })] });
    expect(screen.getByText("Solo Star")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "DJ" }));

    await waitFor(() => {
      expect(screen.getByText("DJ Nova")).toBeInTheDocument();
    });
    expect(screen.queryByText("Solo Star")).not.toBeInTheDocument();
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.filters.categoryId).toBe("cat-dj");
    expect(fetchCalls[0]?.cursor).toBeNull();
  });
});

describe("DiscoverContent — infinite scroll", () => {
  test("scrolling the sentinel into view loads the next page and appends it", async () => {
    const first = makePackage({ id: "pkg-1", talent_name: "Talent One", created_at: "2026-08-01T00:00:00Z" });
    fetchResponses = [{ packages: [makePackage({ id: "pkg-2", talent_name: "Talent Two" })], hasMore: false }];
    renderDiscover({ initialPackages: [first], initialHasMore: true });
    expect(screen.getByText("Talent One")).toBeInTheDocument();

    await triggerSentinelIntersection();

    await waitFor(() => {
      expect(screen.getByText("Talent Two")).toBeInTheDocument();
    });
    expect(screen.getByText("Talent One")).toBeInTheDocument();
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.cursor).toEqual({ createdAt: "2026-08-01T00:00:00Z", priceMin: 1_000_000, id: "pkg-1" });
  });

  test("does not render a sentinel (and never fetches) once hasMore is false", () => {
    renderDiscover({ initialPackages: [makePackage()], initialHasMore: false });
    expect(screen.queryByTestId("discover-load-more-sentinel")).not.toBeInTheDocument();
    expect(fetchCalls).toEqual([]);
  });
});
