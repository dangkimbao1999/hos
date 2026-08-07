import { describe, expect, it, mock } from "bun:test";
import type { createClient } from "@/lib/supabase/server";

type FakeSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const citiesRows = [
  { id: "city-2", name: "Hanoi" },
  { id: "city-1", name: "Da Nang" },
];
const genresRows = [{ id: "genre-1", name: "Hiphop" }];
const categoriesRows = [
  { id: "cat-1", name: "DJ", parent_id: null },
  { id: "cat-2", name: "Solo Singer", parent_id: null },
  { id: "cat-3", name: "Rapper", parent_id: "cat-2" },
  { id: "cat-4", name: "Ballad", parent_id: "cat-2" },
];

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "cities") {
        return { select: () => ({ order: async () => ({ data: citiesRows }) }) };
      }
      if (table === "genres") {
        return { select: () => ({ order: async () => ({ data: genresRows }) }) };
      }
      if (table === "categories") {
        return { select: () => ({ order: async () => ({ data: categoriesRows }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listCategories, listCities, listGenres, mapLookupNames } from "@/lib/supabase/lookups";

describe("listCities", () => {
  it("returns the rows as-is", async () => {
    expect(await listCities()).toEqual(citiesRows);
  });
});

describe("listGenres", () => {
  it("returns the rows as-is", async () => {
    expect(await listGenres()).toEqual(genresRows);
  });
});

describe("mapLookupNames", () => {
  it("resolves a batch of ids to a name map, skipping nulls/duplicates", async () => {
    const supabase = {
      from: (table: string) => {
        expect(table).toBe("cities");
        return { select: () => ({ in: async () => ({ data: citiesRows }) }) };
      },
    } as unknown as FakeSupabaseClient;
    const result = await mapLookupNames(supabase, "cities", ["city-1", null, "city-1", undefined]);
    expect(result.get("city-1")).toBe("Da Nang");
    expect(result.get("city-2")).toBe("Hanoi");
  });

  it("returns an empty map without querying when there are no ids", async () => {
    const supabase = {
      from: () => {
        throw new Error("should not query when there are no ids");
      },
    } as unknown as FakeSupabaseClient;
    expect(await mapLookupNames(supabase, "cities", [null, undefined])).toEqual(new Map());
  });
});

describe("listCategories", () => {
  it("nests subcategories under their top-level parent", async () => {
    expect(await listCategories()).toEqual([
      { id: "cat-1", name: "DJ", subcategories: [] },
      {
        id: "cat-2",
        name: "Solo Singer",
        subcategories: [
          { id: "cat-3", name: "Rapper" },
          { id: "cat-4", name: "Ballad" },
        ],
      },
    ]);
  });
});
