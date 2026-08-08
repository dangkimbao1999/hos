import { describe, expect, it, mock } from "bun:test";
import type { EventDiscoverCursor, EventDiscoverFilters, EventListingSummary } from "@/lib/supabase/types";

let rpcArgs: Record<string, unknown> | null = null;
let rpcData: unknown[] = [];

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "search_event_listings") {
        rpcArgs = args;
        return { data: rpcData };
      }
      throw new Error(`unexpected rpc ${fn}`);
    },
  }),
}));

import { resolveInitialEventFilters, searchEventListings } from "@/lib/supabase/events";
import type { CategoryOption } from "@/lib/supabase/types";

const BASE_FILTERS: EventDiscoverFilters = {
  category: "DJ",
  dateStart: null,
  dateEnd: null,
  search: null,
  sort: "newest",
};

describe("searchEventListings", () => {
  it("maps filters/cursor/limit to the RPC's snake_case params", async () => {
    rpcData = [];
    const cursor: EventDiscoverCursor = { createdAt: "2026-08-01T00:00:00Z", budgetMin: 1_000_000, id: "event-1" };
    await searchEventListings(BASE_FILTERS, cursor, 15);
    expect(rpcArgs).toEqual({
      p_category: "DJ",
      p_date_start: null,
      p_date_end: null,
      p_search: null,
      p_sort: "newest",
      p_cursor_created_at: "2026-08-01T00:00:00Z",
      p_cursor_budget_min: 1_000_000,
      p_cursor_id: "event-1",
      p_limit: 15,
    });
  });

  it("sends null cursor fields when no cursor is given (first page)", async () => {
    rpcData = [];
    await searchEventListings(BASE_FILTERS, null, 15);
    expect(rpcArgs).toMatchObject({ p_cursor_created_at: null, p_cursor_budget_min: null, p_cursor_id: null });
  });

  it("returns the RPC's rows as-is", async () => {
    rpcData = [{ id: "event-1", name: "Wedding Gala" }];
    const result = await searchEventListings(BASE_FILTERS, null, 15);
    expect(result).toEqual(rpcData as unknown as EventListingSummary[]);
  });

  it("returns an empty array when the RPC returns no data", async () => {
    rpcData = [];
    expect(await searchEventListings(BASE_FILTERS, null, 15)).toEqual([]);
  });
});

const CATEGORIES: CategoryOption[] = [
  { id: "cat-dj", name: "DJ", subcategories: [] },
  { id: "cat-solo", name: "Solo Singer", subcategories: [] },
];

describe("resolveInitialEventFilters", () => {
  it("defaults category to null (\"All\") when no ?category= param is given", () => {
    expect(resolveInitialEventFilters(CATEGORIES, {})).toEqual({
      category: null,
      dateStart: null,
      dateEnd: null,
      search: null,
      sort: "newest",
    });
  });

  it("resolves the category name from ?category=", () => {
    expect(resolveInitialEventFilters(CATEGORIES, { category: "DJ" }).category).toBe("DJ");
  });

  it("resolves the search filter from ?q=", () => {
    expect(resolveInitialEventFilters(CATEGORIES, { q: "gala" }).search).toBe("gala");
  });

  it("takes the first value when a param is an array", () => {
    expect(resolveInitialEventFilters(CATEGORIES, { q: ["gala", "other"] }).search).toBe("gala");
  });
});
