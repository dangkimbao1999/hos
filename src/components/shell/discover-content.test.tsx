import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

let mockSearchParams = new URLSearchParams();
mock.module("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

import { DiscoverContent, toCardData } from "@/components/shell/discover-content";
import type { CategoryOption, PackageWithTalent } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  mockSearchParams = new URLSearchParams();
});

function makePackage(overrides: Partial<PackageWithTalent> = {}): PackageWithTalent {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category_id: "cat-solo-singer",
    subcategory_id: null,
    title: "My Package",
    residency: null,
    city_id: "city-hcm",
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

const CATEGORIES: CategoryOption[] = [
  { id: "cat-solo", name: "Solo Singer", subcategories: [{ id: "cat-rapper", name: "Rapper" }] },
  { id: "cat-dj", name: "DJ", subcategories: [] },
];

describe("DiscoverContent — category/subcategory from the URL (sidebar links)", () => {
  const packages = [
    makePackage({ id: "pkg-dj", talent_name: "DJ Nova", category_name: "DJ", subcategory_name: null }),
    makePackage({ id: "pkg-rapper", talent_name: "MC Rap", category_name: "Solo Singer", subcategory_name: "Rapper" }),
    makePackage({ id: "pkg-ballad", talent_name: "Ballad Singer", category_name: "Solo Singer", subcategory_name: "Ballad" }),
  ];

  test("filters to the category named in the ?category= URL param", () => {
    mockSearchParams = new URLSearchParams("category=DJ");
    render(<DiscoverContent role="organizer" packages={packages} categories={CATEGORIES} cities={[]} />);
    expect(screen.getByText("DJ Nova")).toBeInTheDocument();
    expect(screen.queryByText("MC Rap")).not.toBeInTheDocument();
  });

  test("further narrows to the subcategory named in the ?subcategory= URL param", () => {
    mockSearchParams = new URLSearchParams("category=Solo+Singer&subcategory=Rapper");
    render(<DiscoverContent role="organizer" packages={packages} categories={CATEGORIES} cities={[]} />);
    expect(screen.getByText("MC Rap")).toBeInTheDocument();
    expect(screen.queryByText("Ballad Singer")).not.toBeInTheDocument();
    expect(screen.queryByText("DJ Nova")).not.toBeInTheDocument();
  });
});

describe("DiscoverContent — ?q= search from the header search bar", () => {
  const packages = [
    makePackage({ id: "pkg-1", talent_name: "DJ Nova", title: "Wedding Set", category_name: "DJ" }),
    makePackage({ id: "pkg-2", talent_name: "MC Rap", title: "Party Package", category_name: "Solo Singer" }),
  ];

  test("matches the talent's name, ignoring the category tab", () => {
    mockSearchParams = new URLSearchParams("q=nova");
    render(<DiscoverContent role="organizer" packages={packages} categories={CATEGORIES} cities={[]} />);
    expect(screen.getByText("DJ Nova")).toBeInTheDocument();
    expect(screen.queryByText("MC Rap")).not.toBeInTheDocument();
  });

  test("matches the package title too", () => {
    mockSearchParams = new URLSearchParams("q=party");
    render(<DiscoverContent role="organizer" packages={packages} categories={CATEGORIES} cities={[]} />);
    expect(screen.getByText("MC Rap")).toBeInTheDocument();
    expect(screen.queryByText("DJ Nova")).not.toBeInTheDocument();
  });
});
