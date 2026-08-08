import { describe, expect, it, mock } from "bun:test";

let rpcArgs: Record<string, unknown> | null = null;
let rpcData: unknown[] = [];

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "search_bookings_for_role") {
        rpcArgs = args;
        return { data: rpcData };
      }
      throw new Error(`unexpected rpc ${fn}`);
    },
  }),
}));

import { searchBookingsForRole } from "@/lib/supabase/packages";

describe("searchBookingsForRole", () => {
  it("maps role/profileId/filters/page to the RPC's snake_case params", async () => {
    rpcData = [];
    await searchBookingsForRole("organizer", "org-1", { status: "Confirmed", search: "nova" }, 1);
    expect(rpcArgs).toEqual({
      p_role: "organizer",
      p_profile_id: "org-1",
      p_status: "Confirmed",
      p_search: "nova",
      p_limit: 10,
      p_offset: 0,
    });
  });

  it("computes offset from the 1-indexed page number", async () => {
    rpcData = [];
    await searchBookingsForRole("talent", "talent-1", { status: null, search: null }, 3);
    expect(rpcArgs).toMatchObject({ p_limit: 10, p_offset: 20 });
  });

  it("strips total_count from each row and returns it separately", async () => {
    rpcData = [
      { id: "b-1", package_title: "Set A", total_count: 25 },
      { id: "b-2", package_title: "Set B", total_count: 25 },
    ];
    const result = await searchBookingsForRole("organizer", "org-1", { status: null, search: null }, 1);
    expect(result.totalCount).toBe(25);
    expect(result.bookings).toEqual([
      { id: "b-1", package_title: "Set A" },
      { id: "b-2", package_title: "Set B" },
    ] as never);
  });

  it("returns totalCount: 0 and an empty array when there's no data", async () => {
    rpcData = [];
    const result = await searchBookingsForRole("organizer", "org-1", { status: null, search: null }, 1);
    expect(result).toEqual({ bookings: [], totalCount: 0 });
  });
});
