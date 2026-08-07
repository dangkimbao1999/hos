import { describe, expect, it, mock } from "bun:test";

const event = {
  id: "event-1",
  name: "Summer Fest",
  venue: "District 1 Rooftop",
  event_date: "2026-09-01",
  start_time: "18:00:00",
  end_time: "22:00:00",
};

const slot = { id: "slot-1", event_id: "event-1", category_id: "cat-1" };
const category = { id: "cat-1", name: "DJ" };

/** event_slots no longer has a `category` text column (dropped by the
 * 20260807071603_static_lookups.sql migration) — only `category_id`. This
 * fake enforces that shape so a query still selecting `category` fails the
 * way the real dropped column would. */
function makeEventSlotsChain() {
  const chain = {
    select: (fields: string) => {
      if (fields.includes("category") && !fields.includes("category_id")) {
        return { ...chain, in: async () => ({ data: null, error: { message: "column event_slots.category does not exist" } }) };
      }
      return chain;
    },
    eq: () => chain,
    in: async () => ({ data: [slot] }),
  };
  return chain;
}

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "events") {
        return { select: () => ({ eq: async () => ({ data: [event] }) }) };
      }
      if (table === "event_slots") {
        return makeEventSlotsChain();
      }
      if (table === "event_applications") {
        return {
          select: () => ({ in: () => ({ eq: async () => ({ data: [{ applicant_profile_id: "talent-1", slot_id: "slot-1" }] }) }) }),
        };
      }
      if (table === "profiles") {
        return { select: () => ({ in: async () => ({ data: [{ id: "talent-1", full_name: "DJ Sky" }] }) }) };
      }
      if (table === "categories") {
        return { select: () => ({ in: async () => ({ data: [category] }) }) };
      }
      if (table === "package_bookings") {
        return { select: () => ({ eq: () => ({ eq: async () => ({ data: [] }) }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listScheduleEntries } from "@/lib/supabase/schedule";

describe("listScheduleEntries", () => {
  it("includes an accepted event application even though event_slots has no category column anymore", async () => {
    const entries = await listScheduleEntries("org-1", "organizer");
    expect(entries).toEqual([
      {
        title: "DJ Sky — DJ",
        venue: "District 1 Rooftop",
        date: "2026-09-01",
        startHour: 18,
        endHour: 22,
      },
    ]);
  });
});
