import { describe, expect, mock, test } from "bun:test";
import { getBookingDetail, isRelatedPackage, withTalentInfo } from "@/lib/supabase/packages";
import { createClient } from "@/lib/supabase/server";
import type { PackageRow, PackageWithTalent } from "@/lib/supabase/types";

/** Chainable fake that resolves to `data` no matter what order
 * select/eq/single are called in. */
function makeChain(data: unknown) {
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    single: async () => ({ data }),
    then: (resolve: (v: { data: unknown }) => void) => resolve({ data }),
  };
  return chain;
}

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "package_bookings") {
        return makeChain({
          id: "booking-1",
          package_id: "pkg-1",
          organizer_id: "org-1",
          price_vnd: 5_000_000,
          talent_offer_vnd: 5_000_000,
          organizer_offer_vnd: 5_000_000,
          awaiting_response_from: "talent",
          booked_date: "2026-12-01",
          booked_time: "20:00",
          booked_end_time: "21:00",
          city_id: "city-hcm",
          address: "123 Main St",
          payment_method: "Prepaid",
          status: "pending",
          created_at: "2026-08-01T00:00:00Z",
          updated_at: "2026-08-01T00:00:00Z",
        });
      }
      if (table === "packages") {
        return makeChain({
          title: "Acoustic Set",
          description: "A chill set.",
          working_method: "Freelance",
          skill_tags: ["Guitar", "Vocals"],
          talent_id: "talent-1",
        });
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              single: async () => ({
                data: { full_name: id === "org-1" ? "Test Organizer" : "Test Talent" },
              }),
            }),
          }),
        };
      }
      if (table === "cities") {
        return { select: () => ({ in: async () => ({ data: [{ id: "city-hcm", name: "HCM City" }] }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

type FakeSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const CITY_HCM = { id: "city-hcm", name: "HCM City" };
const CATEGORY_SOLO = { id: "cat-solo", name: "Solo Singer" };
const GENRE_RAP = { id: "genre-rap", name: "Rap" };

interface FakeProfile {
  id: string;
  full_name: string;
  slug: string;
  keywords: string[];
  avatar_url?: string | null;
  genre_id?: string | null;
}

/**
 * Minimal stand-in for the Supabase client's `.from(table).select(...).in(...)`
 * chain — withTalentInfo only ever calls that shape, so this is all it needs.
 * Cast past the real client's deeply-generic `.from()` overloads, which TS can't
 * structurally compare against a hand-written mock without blowing up.
 */
function fakeSupabase(options: {
  profiles?: FakeProfile[];
  cities?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  genres?: { id: string; name: string }[];
}): FakeSupabaseClient {
  const tables: Record<string, { id: string }[]> = {
    profiles: options.profiles ?? [],
    cities: options.cities ?? [],
    categories: options.categories ?? [],
    genres: options.genres ?? [],
  };
  return {
    from(table: string) {
      return {
        select() {
          return {
            in(_column: string, ids: string[]) {
              return Promise.resolve({ data: (tables[table] ?? []).filter((row) => ids.includes(row.id)) });
            },
          };
        },
      };
    },
  } as unknown as FakeSupabaseClient;
}

function makePackageRow(overrides: Partial<PackageRow> = {}): PackageRow {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category_id: CATEGORY_SOLO.id,
    subcategory_id: null,
    title: "My Package",
    residency: null,
    city_id: CITY_HCM.id,
    working_method: null,
    skill_tags: [],
    repeat_on: true,
    repeat_days: null,
    start_date: "2026-08-01",
    end_date: "2026-12-31",
    start_time: "18:00:00",
    end_time: "22:00:00",
    description: null,
    price_min_vnd: 1_000_000,
    price_max_vnd: 5_000_000,
    payment_method: "Prepaid",
    status: "active",
    is_most_popular: false,
    is_editor_choice: false,
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("withTalentInfo", () => {
  test("returns an empty array for an empty package list", async () => {
    const result = await withTalentInfo(fakeSupabase({}), []);
    expect(result).toEqual([]);
  });

  test("joins each package with its talent's name/slug/keywords/avatar/genre and resolves city/category/genre names", async () => {
    const supabase = fakeSupabase({
      profiles: [
        {
          id: "talent-1",
          full_name: "Batch2 Talent",
          slug: "batch2-talent-abc",
          keywords: ["LiveBand"],
          avatar_url: "https://example.com/avatar.jpg",
          genre_id: GENRE_RAP.id,
        },
      ],
      cities: [CITY_HCM],
      categories: [CATEGORY_SOLO],
      genres: [GENRE_RAP],
    });
    const [result] = await withTalentInfo(supabase, [makePackageRow({ talent_id: "talent-1" })]);
    expect(result.talent_name).toBe("Batch2 Talent");
    expect(result.talent_slug).toBe("batch2-talent-abc");
    expect(result.talent_keywords).toEqual(["LiveBand"]);
    expect(result.talent_avatar_url).toBe("https://example.com/avatar.jpg");
    expect(result.talent_genre_name).toBe("Rap");
    expect(result.category_name).toBe("Solo Singer");
    expect(result.city_name).toBe("HCM City");
  });

  test("drops packages whose talent profile can't be found", async () => {
    const supabase = fakeSupabase({});
    const result = await withTalentInfo(supabase, [makePackageRow({ talent_id: "missing-talent" })]);
    expect(result).toEqual([]);
  });

  test("preserves all other package fields unchanged", async () => {
    const supabase = fakeSupabase({
      profiles: [{ id: "talent-1", full_name: "Batch2 Talent", slug: "batch2-talent-abc", keywords: [] }],
      cities: [CITY_HCM],
      categories: [CATEGORY_SOLO],
    });
    const [result] = await withTalentInfo(
      supabase,
      [makePackageRow({ id: "pkg-42", price_min_vnd: 2_000_000, is_most_popular: true })]
    );
    expect(result.id).toBe("pkg-42");
    expect(result.price_min_vnd).toBe(2_000_000);
    expect(result.is_most_popular).toBe(true);
  });
});

function makeCandidate(
  overrides: Partial<Pick<PackageWithTalent, "category_name" | "talent_genre_name">> = {}
) {
  return { category_name: "Solo Singer", talent_genre_name: null as string | null, ...overrides };
}

describe("isRelatedPackage", () => {
  test("matches when the package category is in the current talent's categories", () => {
    expect(isRelatedPackage(makeCandidate({ category_name: "DJ" }), ["DJ", "Live Band"], null)).toBe(true);
  });

  test("matches when the talent's genre equals the candidate's genre", () => {
    expect(
      isRelatedPackage(
        makeCandidate({ category_name: "Band", talent_genre_name: "Rap" }),
        ["Solo Singer"],
        "Rap"
      )
    ).toBe(true);
  });

  test("does not match when neither category nor genre overlap", () => {
    expect(
      isRelatedPackage(
        makeCandidate({ category_name: "Band", talent_genre_name: "Jazz" }),
        ["Solo Singer"],
        "Rap"
      )
    ).toBe(false);
  });

  test("does not match on genre when both genres are null", () => {
    expect(
      isRelatedPackage(makeCandidate({ category_name: "Band", talent_genre_name: null }), ["Solo Singer"], null)
    ).toBe(false);
  });
});

describe("getBookingDetail", () => {
  test("joins the booking with its package's detail fields and both parties' names", async () => {
    const result = await getBookingDetail("booking-1");
    expect(result).toMatchObject({
      id: "booking-1",
      organizer_name: "Test Organizer",
      talent_name: "Test Talent",
      package_title: "Acoustic Set",
      package_description: "A chill set.",
      package_working_method: "Freelance",
      package_skill_tags: ["Guitar", "Vocals"],
      venue_city_name: "HCM City",
      venue_address: "123 Main St",
    });
  });
});
