import { describe, expect, test } from "bun:test";
import { toCardData } from "@/components/shell/discover-content";
import type { PackageWithTalent } from "@/lib/supabase/types";

function makePackage(overrides: Partial<PackageWithTalent> = {}): PackageWithTalent {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category_id: "cat-solo-singer",
    subcategory_id: null,
    title: "My Package",
    residency: null,
    city_id: "city-hcm",
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
    talent_name: "Some Talent",
    talent_slug: "some-talent-abc123",
    talent_keywords: [],
    talent_avatar_url: null,
    talent_genre_name: null,
    category_name: "Solo Singer",
    subcategory_name: null,
    city_name: "HCM City",
    ...overrides,
  };
}

describe("toCardData", () => {
  test("uses the talent's name as the card title", () => {
    expect(toCardData(makePackage({ talent_name: "DJ Nova" })).title).toBe("DJ Nova");
  });

  test("combines category and subcategory when subcategory_name is set", () => {
    const card = toCardData(makePackage({ category_name: "Solo Singer", subcategory_name: "Rapper" }));
    expect(card.category).toBe("Solo Singer · Rapper");
  });

  test("carries the talent's real avatar url through", () => {
    const card = toCardData(makePackage({ talent_avatar_url: "https://example.com/avatar.jpg" }));
    expect(card.avatarUrl).toBe("https://example.com/avatar.jpg");
  });
});
