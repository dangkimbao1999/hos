import { afterEach, describe, expect, it, mock } from "bun:test";

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

/** Chainable fake that resolves to `data` no matter what order/how many
 * times select/eq/in are called before the final await. */
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

/** packages no longer has a `location` text column (dropped by the same
 * migration) — only `city_id`. This fake enforces that shape so a query
 * still selecting `location` fails the way the real dropped column would. */
function makePackagesChain(rows: unknown[]) {
  return {
    select: (fields: string) => (fields.includes("location") ? makeChain(null) : makeChain(rows)),
  };
}

let organizerBookings: unknown[] = [];
let talentBookings: unknown[] = [];
let packagesData: unknown[] = [];
let profilesData: unknown[] = [{ id: "talent-1", full_name: "DJ Sky" }];
let eventApplicationsData: unknown[] = [{ applicant_profile_id: "talent-1", slot_id: "slot-1" }];

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "events") return makeChain([event]);
      if (table === "event_slots") return makeEventSlotsChain();
      if (table === "event_applications") return makeChain(eventApplicationsData);
      if (table === "profiles") return makeChain(profilesData);
      if (table === "categories") return makeChain([category]);
      if (table === "packages") return makePackagesChain(packagesData);
      if (table === "cities") return makeChain([{ id: "city-hcm", name: "HCM City" }]);
      if (table === "package_bookings") {
        return {
          select: () => ({
            eq: () => makeChain(organizerBookings),
            in: () => makeChain(talentBookings),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listScheduleEntries } from "@/lib/supabase/schedule";

afterEach(() => {
  organizerBookings = [];
  talentBookings = [];
  packagesData = [];
  profilesData = [{ id: "talent-1", full_name: "DJ Sky" }];
  eventApplicationsData = [{ applicant_profile_id: "talent-1", slot_id: "slot-1" }];
});

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

  it("includes a confirmed package booking for the organizer even though packages has no location column anymore", async () => {
    eventApplicationsData = [];
    organizerBookings = [{ package_id: "pkg-1", booked_date: "2026-09-05", booked_time: "20:00:00" }];
    packagesData = [
      {
        id: "pkg-1",
        title: "Acoustic Set",
        city_id: "city-hcm",
        start_date: "2026-09-01",
        start_time: "09:00:00",
        end_time: "18:00:00",
      },
    ];

    const entries = await listScheduleEntries("org-1", "organizer");
    expect(entries).toContainEqual({
      title: "Acoustic Set",
      venue: "HCM City",
      date: "2026-09-05",
      startHour: 20,
      endHour: 18,
    });
  });

  it("includes a confirmed package booking for the talent even though packages has no location column anymore", async () => {
    eventApplicationsData = [];
    talentBookings = [
      { organizer_id: "org-1", package_id: "pkg-1", booked_date: "2026-09-05", booked_time: "20:00:00" },
    ];
    packagesData = [
      {
        id: "pkg-1",
        title: "Acoustic Set",
        city_id: "city-hcm",
        start_date: "2026-09-01",
        start_time: "09:00:00",
        end_time: "18:00:00",
      },
    ];
    profilesData = [{ id: "org-1", full_name: "Test Organizer" }];

    const entries = await listScheduleEntries("talent-1", "talent");
    expect(entries).toContainEqual({
      title: "Test Organizer — Acoustic Set",
      venue: "HCM City",
      date: "2026-09-05",
      startHour: 20,
      endHour: 18,
    });
  });
});
