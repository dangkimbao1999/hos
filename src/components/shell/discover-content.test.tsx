import { describe, expect, test } from "bun:test";
import { toCardData } from "@/components/shell/discover-content";
import type { PackageWithTalent } from "@/lib/supabase/types";

function makePackage(overrides: Partial<PackageWithTalent> = {}): PackageWithTalent {
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
    talent_name: "Some Talent",
    talent_slug: "some-talent-abc123",
    talent_keywords: [],
    talent_avatar_url: null,
    talent_genre: null,
    ...overrides,
  };
}

describe("toCardData", () => {
  test("uses the talent's name as the card title", () => {
    expect(toCardData(makePackage({ talent_name: "DJ Nova" })).title).toBe("DJ Nova");
  });

  test("combines category and sub_category when sub_category is set", () => {
    const card = toCardData(makePackage({ category: "Solo Singer", sub_category: "Rapper" }));
    expect(card.category).toBe("Solo Singer · Rapper");
  });

  test("carries the talent's real avatar url through", () => {
    const card = toCardData(makePackage({ talent_avatar_url: "https://example.com/avatar.jpg" }));
    expect(card.avatarUrl).toBe("https://example.com/avatar.jpg");
  });
});
