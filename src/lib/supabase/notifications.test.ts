import { describe, expect, it, mock } from "bun:test";

const slot = { id: "slot-1", event_id: "event-1", category_id: "cat-1" };
const category = { id: "cat-1", name: "DJ" };
const event = { id: "event-1", name: "Summer Fest" };

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
      if (table === "event_slots") return makeEventSlotsChain();
      if (table === "events") return { select: () => ({ in: async () => ({ data: [event] }) }) };
      if (table === "categories") return { select: () => ({ in: async () => ({ data: [category] }) }) };
      if (table === "event_applications") {
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({
                data: [{ slot_id: "slot-1", status: "accepted", updated_at: "2026-08-06T10:00:00Z" }],
              }),
            }),
          }),
        };
      }
      if (table === "packages") return { select: () => ({ eq: async () => ({ data: [] }) }) };
      if (table === "quotations") return { select: () => ({ eq: () => ({ eq: async () => ({ data: [] }) }) }) };
      if (table === "kyc_submissions") {
        return { select: () => ({ eq: () => ({ in: async () => ({ data: [] }) }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listNotifications } from "@/lib/supabase/notifications";

describe("listNotifications", () => {
  it("includes the accepted-application notification even though event_slots has no category column anymore", async () => {
    const items = await listNotifications("talent-1", "talent", null);
    expect(items).toHaveLength(1);
    expect(items[0].message).toBe("Your application to Summer Fest (DJ) was accepted.");
  });
});
