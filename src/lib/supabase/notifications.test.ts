import { afterEach, describe, expect, it, mock } from "bun:test";

const slot = { id: "slot-1", event_id: "event-1", category_id: "cat-1" };
const category = { id: "cat-1", name: "DJ" };
const event = { id: "event-1", name: "Summer Fest" };

/** Chainable fake that resolves to `data` no matter what order
 * select/eq/in are called in. */
function makeChain(data: unknown) {
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    then: (resolve: (v: { data: unknown }) => void) => resolve({ data }),
  };
  return chain;
}

/** event_slots no longer has a `category` text column (dropped by the
 * 20260807071603_static_lookups.sql migration) — only `category_id`. This
 * fake enforces that shape so a query still selecting `category` fails the
 * way the real dropped column would. */
function makeEventSlotsChain() {
  const chain: Record<string, unknown> = {
    select: (fields: string) => {
      if (fields.includes("category") && !fields.includes("category_id")) {
        return makeChain(null);
      }
      return chain;
    },
    eq: () => chain,
    in: () => chain,
    then: (resolve: (v: { data: unknown }) => void) => resolve({ data: [slot] }),
  };
  return chain;
}

let eventApplications: unknown[] = [
  { slot_id: "slot-1", status: "accepted", updated_at: "2026-08-06T10:00:00Z" },
];
let packagesData: unknown[] = [];
let bookingsData: unknown[] = [];
let profilesData: unknown[] = [];
let quotationsData: unknown[] = [];
let kycData: unknown[] = [];

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "event_slots") return makeEventSlotsChain();
      if (table === "events") return makeChain([event]);
      if (table === "categories") return makeChain([category]);
      if (table === "event_applications") return makeChain(eventApplications);
      if (table === "packages") return makeChain(packagesData);
      if (table === "package_bookings") return makeChain(bookingsData);
      if (table === "profiles") return makeChain(profilesData);
      if (table === "quotations") return makeChain(quotationsData);
      if (table === "kyc_submissions") return makeChain(kycData);
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listNotifications } from "@/lib/supabase/notifications";

afterEach(() => {
  eventApplications = [{ slot_id: "slot-1", status: "accepted", updated_at: "2026-08-06T10:00:00Z" }];
  packagesData = [];
  bookingsData = [];
  profilesData = [];
  quotationsData = [];
  kycData = [];
});

describe("listNotifications", () => {
  it("includes the accepted-application notification even though event_slots has no category column anymore", async () => {
    const items = await listNotifications("talent-1", "talent", null);
    expect(items).toHaveLength(1);
    expect(items[0].message).toBe("Your application to Summer Fest (DJ) was accepted.");
  });

  it("notifies the organizer when it's their turn on a countered offer", async () => {
    eventApplications = [];
    packagesData = [{ id: "pkg-1", title: "Acoustic Set", talent_id: "talent-1" }];
    bookingsData = [
      {
        package_id: "pkg-1",
        status: "dealing",
        awaiting_response_from: "organizer",
        updated_at: "2026-08-08T00:00:00Z",
      },
    ];
    profilesData = [{ id: "talent-1", full_name: "DJ Nova" }];

    const items = await listNotifications("org-1", "organizer", null);
    expect(items).toEqual([
      expect.objectContaining({
        kind: "counter_offer_received",
        message: "DJ Nova sent a new offer for Acoustic Set.",
      }),
    ]);
  });

  it("does not notify the organizer while it's still the talent's turn", async () => {
    eventApplications = [];
    packagesData = [{ id: "pkg-1", title: "Acoustic Set", talent_id: "talent-1" }];
    bookingsData = [
      {
        package_id: "pkg-1",
        status: "dealing",
        awaiting_response_from: "talent",
        updated_at: "2026-08-08T00:00:00Z",
      },
    ];
    profilesData = [{ id: "talent-1", full_name: "DJ Nova" }];

    const items = await listNotifications("org-1", "organizer", null);
    expect(items).toEqual([]);
  });

  it("notifies the talent when it's their turn on a countered offer", async () => {
    eventApplications = [];
    packagesData = [{ id: "pkg-1", title: "Acoustic Set", talent_id: "talent-1" }];
    bookingsData = [
      {
        organizer_id: "org-1",
        package_id: "pkg-1",
        status: "dealing",
        awaiting_response_from: "talent",
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-08T00:00:00Z",
      },
    ];
    profilesData = [{ id: "org-1", full_name: "Test Organizer" }];

    const items = await listNotifications("talent-1", "talent", null);
    expect(items).toContainEqual(
      expect.objectContaining({
        kind: "counter_offer_received",
        message: "Test Organizer sent a new offer for Acoustic Set.",
      })
    );
  });

  it("notifies the organizer when the talent marks a confirmed booking complete", async () => {
    eventApplications = [];
    packagesData = [{ id: "pkg-1", title: "Acoustic Set", talent_id: "talent-1" }];
    bookingsData = [
      {
        package_id: "pkg-1",
        status: "confirmed",
        awaiting_response_from: null,
        talent_marked_complete_at: "2026-08-08T10:00:00Z",
        updated_at: "2026-08-08T00:00:00Z",
      },
    ];
    profilesData = [{ id: "talent-1", full_name: "DJ Nova" }];

    const items = await listNotifications("org-1", "organizer", null);
    expect(items).toContainEqual(
      expect.objectContaining({
        kind: "booking_marked_complete_by_talent",
        message: "DJ Nova marked Acoustic Set as complete — confirm to finish this booking.",
      })
    );
  });

  it("does not notify the organizer about talent-marked-complete when it hasn't happened", async () => {
    eventApplications = [];
    packagesData = [{ id: "pkg-1", title: "Acoustic Set", talent_id: "talent-1" }];
    bookingsData = [
      {
        package_id: "pkg-1",
        status: "confirmed",
        awaiting_response_from: null,
        talent_marked_complete_at: null,
        updated_at: "2026-08-08T00:00:00Z",
      },
    ];
    profilesData = [{ id: "talent-1", full_name: "DJ Nova" }];

    const items = await listNotifications("org-1", "organizer", null);
    expect(items.map((i) => i.kind)).not.toContain("booking_marked_complete_by_talent");
  });
});
