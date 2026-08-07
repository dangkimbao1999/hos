import { describe, expect, test } from "bun:test";
import { isRelatedPackage, withTalentInfo } from "@/lib/supabase/packages";
import { createClient } from "@/lib/supabase/server";
import type { PackageRow, PackageWithTalent } from "@/lib/supabase/types";

type FakeSupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface FakeProfile {
  id: string;
  full_name: string;
  slug: string;
  keywords: string[];
  avatar_url?: string | null;
  genre?: string | null;
}

/**
 * Minimal stand-in for the Supabase client's `.from("profiles").select(...).in(...)`
 * chain — withTalentInfo only ever calls that one chain, so this is all it needs.
 * Cast past the real client's deeply-generic `.from()` overloads, which TS can't
 * structurally compare against a hand-written mock without blowing up.
 */
function fakeSupabase(profiles: FakeProfile[]): FakeSupabaseClient {
  return {
    from() {
      return {
        select() {
          return {
            in(_column: string, ids: string[]) {
              return Promise.resolve({ data: profiles.filter((p) => ids.includes(p.id)) });
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
    category: "Solo Singer",
    sub_category: null,
    title: "My Package",
    residency: null,
    location: "HCM City",
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
    const result = await withTalentInfo(fakeSupabase([]), []);
    expect(result).toEqual([]);
  });

  test("joins each package with its talent's name/slug/keywords/avatar/genre", async () => {
    const supabase = fakeSupabase([
      {
        id: "talent-1",
        full_name: "Batch2 Talent",
        slug: "batch2-talent-abc",
        keywords: ["LiveBand"],
        avatar_url: "https://example.com/avatar.jpg",
        genre: "Rap",
      },
    ]);
    const [result] = await withTalentInfo(supabase, [makePackageRow({ talent_id: "talent-1" })]);
    expect(result.talent_name).toBe("Batch2 Talent");
    expect(result.talent_slug).toBe("batch2-talent-abc");
    expect(result.talent_keywords).toEqual(["LiveBand"]);
    expect(result.talent_avatar_url).toBe("https://example.com/avatar.jpg");
    expect(result.talent_genre).toBe("Rap");
  });

  test("drops packages whose talent profile can't be found", async () => {
    const supabase = fakeSupabase([]);
    const result = await withTalentInfo(supabase, [makePackageRow({ talent_id: "missing-talent" })]);
    expect(result).toEqual([]);
  });

  test("preserves all other package fields unchanged", async () => {
    const supabase = fakeSupabase([
      { id: "talent-1", full_name: "Batch2 Talent", slug: "batch2-talent-abc", keywords: [] },
    ]);
    const [result] = await withTalentInfo(
      supabase,
      [makePackageRow({ id: "pkg-42", price_min_vnd: 2_000_000, is_most_popular: true })]
    );
    expect(result.id).toBe("pkg-42");
    expect(result.price_min_vnd).toBe(2_000_000);
    expect(result.is_most_popular).toBe(true);
  });
});

function makeCandidate(overrides: Partial<Pick<PackageWithTalent, "category" | "talent_genre">> = {}) {
  return { category: "Solo Singer", talent_genre: null as string | null, ...overrides };
}

describe("isRelatedPackage", () => {
  test("matches when the package category is in the current talent's categories", () => {
    expect(isRelatedPackage(makeCandidate({ category: "DJ" }), ["DJ", "Live Band"], null)).toBe(true);
  });

  test("matches when the talent's genre equals the candidate's genre", () => {
    expect(isRelatedPackage(makeCandidate({ category: "Band", talent_genre: "Rap" }), ["Solo Singer"], "Rap")).toBe(
      true
    );
  });

  test("does not match when neither category nor genre overlap", () => {
    expect(isRelatedPackage(makeCandidate({ category: "Band", talent_genre: "Jazz" }), ["Solo Singer"], "Rap")).toBe(
      false
    );
  });

  test("does not match on genre when both genres are null", () => {
    expect(isRelatedPackage(makeCandidate({ category: "Band", talent_genre: null }), ["Solo Singer"], null)).toBe(
      false
    );
  });
});
