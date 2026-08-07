import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { PackageWithLookupNames, ProfileWithLookupNames } from "@/lib/supabase/types";

mock.module("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

let talentToReturn: ProfileWithLookupNames | null = {
  id: "talent-1",
  full_name: "Test Talent",
  genre_name: null,
} as ProfileWithLookupNames;
let packagesToReturn: PackageWithLookupNames[] = [];
let relatedArgs: { talentId: string; categories: string[]; genre: string | null; limit: number } | null = null;

mock.module("@/lib/supabase/packages", () => ({
  getTalentBySlug: async () => talentToReturn,
  listPackagesForTalentWithNames: async () => packagesToReturn,
  listRelatedPackagesForTalent: async (talentId: string, categories: string[], genre: string | null, limit: number) => {
    relatedArgs = { talentId, categories, genre, limit };
    return [];
  },
}));
mock.module("@/lib/supabase/reviews", () => ({
  getTalentReviewSummary: async () => ({ avgRating: null, count: 0, reviews: [] }),
}));
mock.module("@/components/talent-detail/talent-detail-content", () => ({
  TalentDetailContent: (props: { talent: ProfileWithLookupNames }) => (
    <div data-testid="content">{props.talent.full_name}</div>
  ),
}));

import TalentDetailPage from "@/app/organizer/talents/[slug]/page";

afterEach(() => {
  cleanup();
  talentToReturn = { id: "talent-1", full_name: "Test Talent", genre_name: null } as ProfileWithLookupNames;
  packagesToReturn = [];
  relatedArgs = null;
});

describe("TalentDetailPage", () => {
  it("renders TalentDetailContent with the fetched talent when found", async () => {
    const jsx = await TalentDetailPage({ params: Promise.resolve({ slug: "test-talent" }) });
    render(jsx);
    expect(screen.getByTestId("content")).toHaveTextContent("Test Talent");
  });

  it("derives related-package categories from the talent's own packages, deduplicated", async () => {
    packagesToReturn = [
      { category_name: "DJ" } as PackageWithLookupNames,
      { category_name: "DJ" } as PackageWithLookupNames,
      { category_name: "Live Band" } as PackageWithLookupNames,
    ];

    await TalentDetailPage({ params: Promise.resolve({ slug: "test-talent" }) });

    expect(relatedArgs).toEqual({ talentId: "talent-1", categories: ["DJ", "Live Band"], genre: null, limit: 10 });
  });

  it("passes the talent's genre through for related-talent matching", async () => {
    talentToReturn = {
      id: "talent-1",
      full_name: "Test Talent",
      genre_name: "Rap",
    } as ProfileWithLookupNames;

    await TalentDetailPage({ params: Promise.resolve({ slug: "test-talent" }) });

    expect(relatedArgs?.genre).toBe("Rap");
  });

  it("calls notFound when no talent matches the slug", async () => {
    talentToReturn = null;
    await expect(TalentDetailPage({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });
});
