import { describe, expect, it, mock } from "bun:test";
import type { DiscoverCursor, DiscoverFilters, PackageWithTalent } from "@/lib/supabase/types";

let rpcArgs: Record<string, unknown> | null = null;
let rpcData: unknown[] = [];
let packagesTableRows: { talent_id: string }[] = [];
let profilesTableRows: { keywords: string[] }[] = [];

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "search_discover_packages") {
        rpcArgs = args;
        return { data: rpcData };
      }
      throw new Error(`unexpected rpc ${fn}`);
    },
    from: (table: string) => {
      if (table === "packages") {
        return { select: () => ({ eq: async () => ({ data: packagesTableRows }) }) };
      }
      if (table === "profiles") {
        return { select: () => ({ in: async () => ({ data: profilesTableRows }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listDiscoverHashtagSuggestions, searchDiscoverPackages } from "@/lib/supabase/packages";

const BASE_FILTERS: DiscoverFilters = {
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

describe("searchDiscoverPackages", () => {
  it("maps filters/cursor/limit to the RPC's snake_case params", async () => {
    rpcData = [];
    const cursor: DiscoverCursor = { createdAt: "2026-08-01T00:00:00Z", priceMin: 1_000_000, id: "pkg-1" };
    await searchDiscoverPackages(BASE_FILTERS, cursor, 15);
    expect(rpcArgs).toEqual({
      p_category_id: "cat-1",
      p_subcategory_id: null,
      p_city_id: null,
      p_price_min: 0,
      p_price_max: 5_000_000_000,
      p_hashtags: [],
      p_date_start: null,
      p_date_end: null,
      p_search: null,
      p_sort: "newest",
      p_cursor_created_at: "2026-08-01T00:00:00Z",
      p_cursor_price_min: 1_000_000,
      p_cursor_id: "pkg-1",
      p_limit: 15,
    });
  });

  it("sends null cursor fields when no cursor is given (first page)", async () => {
    rpcData = [];
    await searchDiscoverPackages(BASE_FILTERS, null, 15);
    expect(rpcArgs).toMatchObject({ p_cursor_created_at: null, p_cursor_price_min: null, p_cursor_id: null });
  });

  it("returns the RPC's rows as-is", async () => {
    rpcData = [{ id: "pkg-1", talent_name: "DJ Nova" }];
    const result = await searchDiscoverPackages(BASE_FILTERS, null, 15);
    expect(result).toEqual(rpcData as unknown as PackageWithTalent[]);
  });

  it("returns an empty array when the RPC returns no data", async () => {
    rpcData = [];
    expect(await searchDiscoverPackages(BASE_FILTERS, null, 15)).toEqual([]);
  });
});

describe("listDiscoverHashtagSuggestions", () => {
  it("returns the deduped keywords of talents with an active package", async () => {
    packagesTableRows = [{ talent_id: "talent-1" }, { talent_id: "talent-1" }, { talent_id: "talent-2" }];
    profilesTableRows = [
      { keywords: ["LiveBand", "Wedding"] },
      { keywords: ["Wedding", "Corporate"] },
    ];
    const result = await listDiscoverHashtagSuggestions();
    expect(new Set(result)).toEqual(new Set(["LiveBand", "Wedding", "Corporate"]));
  });

  it("returns an empty array without querying profiles when there are no active packages", async () => {
    packagesTableRows = [];
    profilesTableRows = [{ keywords: ["should not be reached"] }];
    expect(await listDiscoverHashtagSuggestions()).toEqual([]);
  });
});
