import { describe, expect, it, mock } from "bun:test";
import type { DiscoverFilters, PackageWithTalent } from "@/lib/supabase/types";

let searchResult: PackageWithTalent[] = [];
let searchArgs: { filters: DiscoverFilters; cursor: unknown; limit: number } | null = null;

mock.module("@/lib/supabase/packages", () => ({
  DISCOVER_PAGE_SIZE: 15,
  searchDiscoverPackages: async (filters: DiscoverFilters, cursor: unknown, limit: number) => {
    searchArgs = { filters, cursor, limit };
    return searchResult;
  },
}));

import { fetchDiscoverPackages } from "@/lib/supabase/discover-actions";

const FILTERS: DiscoverFilters = {
  categoryId: "cat-1",
  subcategoryId: null,
  cityId: null,
  priceMin: 0,
  priceMax: 5_000_000_000,
  hashtags: [],
  dateStart: null,
  dateEnd: null,
  search: null,
  sort: "newest",
};

function makePackage(id: string): PackageWithTalent {
  return { id } as unknown as PackageWithTalent;
}

describe("fetchDiscoverPackages", () => {
  it("fetches a page of 15 and reports hasMore when a full page comes back", async () => {
    searchResult = Array.from({ length: 15 }, (_, i) => makePackage(`pkg-${i}`));
    const result = await fetchDiscoverPackages(FILTERS, null);
    expect(searchArgs).toMatchObject({ filters: FILTERS, cursor: null, limit: 15 });
    expect(result).toEqual({ packages: searchResult, hasMore: true });
  });

  it("reports hasMore: false when the page comes back short (end of results)", async () => {
    searchResult = [makePackage("pkg-1"), makePackage("pkg-2")];
    const result = await fetchDiscoverPackages(FILTERS, null);
    expect(result).toEqual({ packages: searchResult, hasMore: false });
  });

  it("reports hasMore: false for an empty page", async () => {
    searchResult = [];
    const result = await fetchDiscoverPackages(FILTERS, null);
    expect(result).toEqual({ packages: [], hasMore: false });
  });

  it("passes the given cursor through to searchDiscoverPackages", async () => {
    searchResult = [];
    const cursor = { createdAt: "2026-08-01T00:00:00Z", priceMin: 1_000_000, id: "pkg-1" };
    await fetchDiscoverPackages(FILTERS, cursor);
    expect(searchArgs).toMatchObject({ cursor });
  });
});
