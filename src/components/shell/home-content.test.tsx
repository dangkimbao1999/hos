import { describe, expect, test } from "bun:test";
import { toCardData } from "@/components/shell/home-content";
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

  test("falls back to just category when sub_category is null", () => {
    const card = toCardData(makePackage({ category: "Band", sub_category: null }));
    expect(card.category).toBe("Band");
  });

  test("always tags the card as VND currency", () => {
    expect(toCardData(makePackage()).currency).toBe("VND");
  });

  test("carries the real price range through", () => {
    const card = toCardData(makePackage({ price_min_vnd: 2_000_000, price_max_vnd: 6_000_000 }));
    expect(card.priceMin).toBe(2_000_000);
    expect(card.priceMax).toBe(6_000_000);
  });
});
