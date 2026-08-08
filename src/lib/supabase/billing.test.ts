import { afterEach, describe, expect, it, mock } from "bun:test";

const slot = { id: "slot-1", event_id: "event-1", category_id: "cat-1", price_usd: 200 };
const category = { id: "cat-1", name: "DJ" };
const event = {
  id: "event-1",
  organizer_id: "org-1",
  name: "Summer Fest",
  venue: "District 1 Rooftop",
  event_date: "2026-09-01",
};
const applicant = { id: "talent-1", full_name: "DJ Sky" };

/** Chainable fake that resolves to `data` no matter what order
 * select/eq/in/order are called in — real supabase-js queries are built the
 * same way regardless of clause order. */
function makeChain(data: unknown) {
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    order: () => chain,
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

/** packages no longer has a `location` text column (dropped by the same
 * migration) — only `city_id`. This fake enforces that shape so a query
 * still selecting `location` fails the way the real dropped column would. */
function makePackagesChain(rows: unknown[]) {
  return {
    select: (fields: string) => (fields.includes("location") ? makeChain(null) : makeChain(rows)),
  };
}

let packagesData: unknown[] = [];
let bookingsData: unknown[] = [];
let citiesData: unknown[] = [];
let profilesData: unknown[] = [applicant];

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "packages") return makePackagesChain(packagesData);
      if (table === "package_bookings") return makeChain(bookingsData);
      if (table === "cities") return makeChain(citiesData);
      if (table === "event_slots") return makeEventSlotsChain();
      if (table === "events") return makeChain([event]);
      if (table === "categories") return makeChain([category]);
      if (table === "profiles") return makeChain(profilesData);
      if (table === "event_applications") {
        return makeChain([
          { slot_id: "slot-1", applicant_profile_id: "talent-1", offer_amount_usd: null, created_at: "2026-08-01T00:00:00Z" },
        ]);
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listBillingData, USD_TO_VND_RATE } from "@/lib/supabase/billing";

afterEach(() => {
  packagesData = [];
  bookingsData = [];
  citiesData = [];
  profilesData = [applicant];
});

describe("listBillingData", () => {
  it("talent: includes an accepted event application even though event_slots has no category column anymore", async () => {
    const { groups } = await listBillingData("talent-1", "talent");
    expect(groups).toEqual([
      {
        title: "Summer Fest",
        venue: "District 1 Rooftop",
        lines: [{ name: "DJ", date: "2026-09-01", amountVnd: 200 * USD_TO_VND_RATE }],
      },
    ]);
  });

  it("organizer: includes an accepted event application even though event_slots has no category column anymore", async () => {
    const { groups } = await listBillingData("org-1", "organizer");
    expect(groups).toEqual([
      {
        title: "Summer Fest",
        venue: "District 1 Rooftop",
        lines: [{ name: "DJ Sky", date: "2026-09-01", amountVnd: 200 * USD_TO_VND_RATE }],
      },
    ]);
  });

  it("talent: includes a confirmed package booking even though packages has no location column anymore", async () => {
    packagesData = [{ id: "pkg-1", title: "Acoustic Set", city_id: "city-hcm" }];
    bookingsData = [
      { organizer_id: "org-1", package_id: "pkg-1", booked_date: "2026-09-05", price_vnd: 5_000_000, created_at: "2026-08-01T00:00:00Z" },
    ];
    citiesData = [{ id: "city-hcm", name: "HCM City" }];
    profilesData = [{ id: "org-1", full_name: "Test Organizer" }];

    const { groups } = await listBillingData("talent-1", "talent");
    expect(groups).toContainEqual({
      title: "Acoustic Set",
      venue: "HCM City",
      lines: [{ name: "Test Organizer", date: "2026-09-05", amountVnd: 5_000_000 }],
    });
  });

  it("organizer: includes a confirmed package booking even though packages has no location column anymore", async () => {
    bookingsData = [
      { package_id: "pkg-1", booked_date: "2026-09-05", price_vnd: 5_000_000, created_at: "2026-08-01T00:00:00Z" },
    ];
    packagesData = [{ id: "pkg-1", title: "Acoustic Set", city_id: "city-hcm", talent_id: "talent-1" }];
    citiesData = [{ id: "city-hcm", name: "HCM City" }];
    profilesData = [{ id: "talent-1", full_name: "DJ Sky" }];

    const { groups } = await listBillingData("org-1", "organizer");
    expect(groups).toContainEqual({
      title: "Acoustic Set",
      venue: "HCM City",
      lines: [{ name: "DJ Sky", date: "2026-09-05", amountVnd: 5_000_000 }],
    });
  });
});
