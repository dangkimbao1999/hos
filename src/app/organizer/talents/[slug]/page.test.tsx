import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { PackageRow, Profile } from "@/lib/supabase/types";

mock.module("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

let talentToReturn: Profile | null = { id: "talent-1", full_name: "Test Talent" } as Profile;
let packagesToReturn: PackageRow[] = [];
let relatedArgs: { talentId: string; categories: string[]; limit: number } | null = null;

mock.module("@/lib/supabase/packages", () => ({
  getTalentBySlug: async () => talentToReturn,
  listPackagesForTalent: async () => packagesToReturn,
  listRelatedPackagesForTalent: async (talentId: string, categories: string[], limit: number) => {
    relatedArgs = { talentId, categories, limit };
    return [];
  },
}));
mock.module("@/lib/supabase/reviews", () => ({
  getTalentReviewSummary: async () => ({ avgRating: null, count: 0, reviews: [] }),
}));
mock.module("@/components/talent-detail/talent-detail-content", () => ({
  TalentDetailContent: (props: { talent: Profile }) => <div data-testid="content">{props.talent.full_name}</div>,
}));

import TalentDetailPage from "@/app/organizer/talents/[slug]/page";

afterEach(() => {
  cleanup();
  talentToReturn = { id: "talent-1", full_name: "Test Talent" } as Profile;
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
      { category: "DJ" } as PackageRow,
      { category: "DJ" } as PackageRow,
      { category: "Live Band" } as PackageRow,
    ];

    await TalentDetailPage({ params: Promise.resolve({ slug: "test-talent" }) });

    expect(relatedArgs).toEqual({ talentId: "talent-1", categories: ["DJ", "Live Band"], limit: 10 });
  });

  it("calls notFound when no talent matches the slug", async () => {
    talentToReturn = null;
    await expect(TalentDetailPage({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });
});
