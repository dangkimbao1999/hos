import { describe, expect, it, mock } from "bun:test";

let packagesRows: { id: string; talent_id: string; created_at: string }[] = [];
let packagesCount = 0;
let bookingRows: { package_id: string }[] = [];
let lastPackagesRangeArgs: [number, number] | null = null;

let quotationsRows: Record<string, unknown>[] = [];
let quotationsCount = 0;
let lastQuotationsRangeArgs: [number, number] | null = null;

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "packages") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          order: () => chain,
          range: async (from: number, to: number) => {
            lastPackagesRangeArgs = [from, to];
            return { data: packagesRows, count: packagesCount };
          },
        };
        return chain;
      }
      if (table === "package_bookings") {
        return { select: () => ({ in: async () => ({ data: bookingRows }) }) };
      }
      if (table === "quotations") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          order: () => chain,
          range: async (from: number, to: number) => {
            lastQuotationsRangeArgs = [from, to];
            return { data: quotationsRows, count: quotationsCount };
          },
        };
        return chain;
      }
      if (table === "profiles") {
        return { select: () => ({ in: async () => ({ data: [] }) }) };
      }
      if (table === "cities") {
        return { select: () => ({ in: async () => ({ data: [] }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listPackagesWithBookingCountsPage } from "@/lib/supabase/packages";
import { listQuotationsForOrganizerPage, listQuotationsForTalentPage } from "@/lib/supabase/quotations";

describe("listPackagesWithBookingCountsPage", () => {
  it("requests the right .range() offset for a 1-indexed page", async () => {
    packagesRows = [];
    packagesCount = 0;
    await listPackagesWithBookingCountsPage("talent-1", 3);
    expect(lastPackagesRangeArgs).toEqual([20, 29]);
  });

  it("attaches each returned package's booking count and the total count", async () => {
    packagesRows = [
      { id: "pkg-1", talent_id: "talent-1", created_at: "2026-08-01T00:00:00Z" },
      { id: "pkg-2", talent_id: "talent-1", created_at: "2026-08-02T00:00:00Z" },
    ];
    packagesCount = 25;
    bookingRows = [{ package_id: "pkg-1" }, { package_id: "pkg-1" }, { package_id: "pkg-2" }];

    const result = await listPackagesWithBookingCountsPage("talent-1", 1);
    expect(result.totalCount).toBe(25);
    expect(result.packages).toEqual([
      { id: "pkg-1", talent_id: "talent-1", created_at: "2026-08-01T00:00:00Z", bookingCount: 2 },
      { id: "pkg-2", talent_id: "talent-1", created_at: "2026-08-02T00:00:00Z", bookingCount: 1 },
    ] as never);
  });

  it("returns an empty page and the total count without querying bookings when there are no packages on this page", async () => {
    packagesRows = [];
    packagesCount = 0;
    bookingRows = [{ package_id: "should-not-be-reached" }];
    const result = await listPackagesWithBookingCountsPage("talent-1", 1);
    expect(result).toEqual({ packages: [], totalCount: 0 });
  });
});

describe("listQuotationsForOrganizerPage / listQuotationsForTalentPage", () => {
  it("requests the right .range() offset for a 1-indexed page", async () => {
    quotationsRows = [];
    quotationsCount = 0;
    await listQuotationsForOrganizerPage("org-1", 2);
    expect(lastQuotationsRangeArgs).toEqual([10, 19]);
  });

  it("returns the resolved rows plus the total count, from the organizer's side", async () => {
    quotationsRows = [{ id: "quote-1", organizer_id: "org-1", talent_id: "talent-1", city_id: null }];
    quotationsCount = 7;
    const result = await listQuotationsForOrganizerPage("org-1", 1);
    expect(result.totalCount).toBe(7);
    expect(result.quotations).toHaveLength(1);
    expect(result.quotations[0]?.id).toBe("quote-1");
  });

  it("returns the resolved rows plus the total count, from the talent's side", async () => {
    quotationsRows = [{ id: "quote-2", organizer_id: "org-1", talent_id: "talent-1", city_id: null }];
    quotationsCount = 3;
    const result = await listQuotationsForTalentPage("talent-1", 1);
    expect(result.totalCount).toBe(3);
    expect(result.quotations[0]?.id).toBe("quote-2");
  });

  it("returns an empty page and the total count when there are no rows", async () => {
    quotationsRows = [];
    quotationsCount = 0;
    const result = await listQuotationsForOrganizerPage("org-1", 1);
    expect(result).toEqual({ quotations: [], totalCount: 0 });
  });
});
