import { describe, expect, it, mock } from "bun:test";
import type { ScheduleEntry } from "@/lib/supabase/schedule";

let currentProfile: { id: string; role: "organizer" | "talent" } | null = { id: "org-1", role: "organizer" };
mock.module("@/lib/supabase/server", () => ({
  getCurrentProfile: async () => currentProfile,
}));

let listArgs: { profileId: string; role: string; dateStart: string; dateEnd: string } | null = null;
let listResult: ScheduleEntry[] = [];
mock.module("@/lib/supabase/schedule", () => ({
  listScheduleEntries: async (profileId: string, role: string, dateStart: string, dateEnd: string) => {
    listArgs = { profileId, role, dateStart, dateEnd };
    return listResult;
  },
}));

import { fetchScheduleEntries } from "@/lib/supabase/schedule-actions";

describe("fetchScheduleEntries", () => {
  it("re-derives the signed-in user server-side and passes their id/role through, never a client-supplied one", async () => {
    currentProfile = { id: "org-1", role: "organizer" };
    listResult = [{ title: "Set", venue: "Venue", date: "2026-09-01", startHour: 18, endHour: 22 }];
    const result = await fetchScheduleEntries("2026-08-26", "2026-10-06");
    expect(listArgs).toEqual({ profileId: "org-1", role: "organizer", dateStart: "2026-08-26", dateEnd: "2026-10-06" });
    expect(result).toEqual(listResult);
  });

  it("returns an empty array when there is no signed-in user", async () => {
    currentProfile = null;
    const result = await fetchScheduleEntries("2026-08-26", "2026-10-06");
    expect(result).toEqual([]);
  });
});
