import { describe, expect, it, mock } from "bun:test";

let rpcArgs: Record<string, unknown> | null = null;
let rpcData: unknown[] = [];

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "list_schedule_entries") {
        rpcArgs = args;
        return { data: rpcData };
      }
      throw new Error(`unexpected rpc ${fn}`);
    },
  }),
}));

import { listScheduleEntries } from "@/lib/supabase/schedule";

describe("listScheduleEntries", () => {
  it("maps profileId/role/date window to the RPC's snake_case params", async () => {
    rpcData = [];
    await listScheduleEntries("org-1", "organizer", "2026-07-26", "2026-09-06");
    expect(rpcArgs).toEqual({
      p_profile_id: "org-1",
      p_role: "organizer",
      p_date_start: "2026-07-26",
      p_date_end: "2026-09-06",
    });
  });

  it("converts each row's start_time/end_time strings to decimal hours", async () => {
    rpcData = [
      { title: "DJ Sky — DJ", venue: "District 1 Rooftop", date: "2026-09-01", start_time: "18:00:00", end_time: "22:30:00" },
    ];
    const result = await listScheduleEntries("org-1", "organizer", "2026-09-01", "2026-09-30");
    expect(result).toEqual([
      { title: "DJ Sky — DJ", venue: "District 1 Rooftop", date: "2026-09-01", startHour: 18, endHour: 22.5 },
    ]);
  });

  it("returns an empty array when the RPC returns no data", async () => {
    rpcData = [];
    expect(await listScheduleEntries("org-1", "organizer", "2026-09-01", "2026-09-30")).toEqual([]);
  });
});
