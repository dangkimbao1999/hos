import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, DiscoverFilters, LookupOption, PackageWithTalent } from "@/lib/supabase/types";

const CATEGORIES: CategoryOption[] = [
  { id: "cat-dj", name: "DJ", subcategories: [] },
  { id: "cat-solo", name: "Solo Singer", subcategories: [{ id: "cat-rapper", name: "Rapper" }] },
];
const CITIES: LookupOption[] = [{ id: "city-1", name: "Hanoi" }];

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => CATEGORIES,
  listCities: async () => CITIES,
}));

let searchArgs: { filters: DiscoverFilters; cursor: unknown; limit: number } | null = null;
let searchResult: PackageWithTalent[] = [];
mock.module("@/lib/supabase/packages", () => ({
  DISCOVER_PAGE_SIZE: 15,
  listDiscoverHashtagSuggestions: async () => ["LiveBand", "Wedding"],
  searchDiscoverPackages: async (filters: DiscoverFilters, cursor: unknown, limit: number) => {
    searchArgs = { filters, cursor, limit };
    return searchResult;
  },
}));

let discoverContentProps: Record<string, unknown> | null = null;
mock.module("@/components/shell/discover-content", () => ({
  DiscoverContent: (props: Record<string, unknown>) => {
    discoverContentProps = props;
    return <div data-testid="content" />;
  },
}));

import OrganizerDiscoverPage from "@/app/organizer/discover/page";

function makePackage(id: string): PackageWithTalent {
  return { id } as unknown as PackageWithTalent;
}

describe("OrganizerDiscoverPage", () => {
  it("fetches categories/cities/hashtag suggestions and the first page, passing them to DiscoverContent", async () => {
    searchResult = [makePackage("pkg-1")];
    const jsx = await OrganizerDiscoverPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(discoverContentProps).toMatchObject({
      role: "organizer",
      categories: CATEGORIES,
      cities: CITIES,
      hashtagSuggestions: ["LiveBand", "Wedding"],
      initialPackages: searchResult,
      initialHasMore: false,
    });
  });

  it("reports initialHasMore: true when the first page comes back full (15 rows)", async () => {
    searchResult = Array.from({ length: 15 }, (_, i) => makePackage(`pkg-${i}`));
    const jsx = await OrganizerDiscoverPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(discoverContentProps).toMatchObject({ initialHasMore: true });
  });

  it("defaults to the first category when no ?category= param is given", async () => {
    searchResult = [];
    await render(await OrganizerDiscoverPage({ searchParams: Promise.resolve({}) }));
    expect(searchArgs?.filters.categoryId).toBe("cat-dj");
    expect(searchArgs?.cursor).toBeNull();
    expect(searchArgs?.limit).toBe(15);
  });

  it("resolves categoryId/subcategoryId from the ?category=/?subcategory= URL params", async () => {
    searchResult = [];
    await render(
      await OrganizerDiscoverPage({ searchParams: Promise.resolve({ category: "Solo Singer", subcategory: "Rapper" }) })
    );
    expect(searchArgs?.filters.categoryId).toBe("cat-solo");
    expect(searchArgs?.filters.subcategoryId).toBe("cat-rapper");
  });

  it("resolves the search filter from ?q=", async () => {
    searchResult = [];
    await render(await OrganizerDiscoverPage({ searchParams: Promise.resolve({ q: "nova" }) }));
    expect(searchArgs?.filters.search).toBe("nova");
  });
});
