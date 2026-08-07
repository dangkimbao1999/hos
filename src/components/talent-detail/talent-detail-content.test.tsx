import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("@/components/talent-detail/booking-panel", () => ({
  BookingPanel: () => null,
}));
mock.module("@/components/talent-detail/request-quote-dialog", () => ({
  RequestQuoteDialog: () => null,
}));

import { TalentDetailContent } from "@/components/talent-detail/talent-detail-content";
import type { PackageRow, PackageWithTalent, Profile } from "@/lib/supabase/types";
import type { TalentReviewSummary } from "@/lib/supabase/reviews";

afterEach(() => cleanup());

function makeTalent(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "talent-1",
    role: "talent",
    slug: "test-talent",
    full_name: "Test Talent",
    avatar_url: null,
    bio: "A great performer.",
    location: null,
    keywords: [],
    kyc_status: "verified",
    notifications_read_at: null,
    created_at: new Date().toISOString(),
    cover_url: null,
    gallery_urls: [],
    social_links: [],
    achievements: [],
    services: [],
    date_of_birth: null,
    genre: null,
    ...overrides,
  };
}

const reviewSummary: TalentReviewSummary = { avgRating: 4.8, count: 0, reviews: [] };

function makePackage(overrides: Partial<PackageRow> = {}): PackageRow {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category: "DJ",
    sub_category: null,
    title: "Festival set",
    residency: null,
    location: "HCM City",
    repeat_on: false,
    repeat_days: null,
    start_date: "2026-08-01",
    end_date: "2026-12-31",
    start_time: "18:00:00",
    end_time: "22:00:00",
    description: "A real package description.",
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

function makeRelatedPackage(overrides: Partial<PackageWithTalent> = {}): PackageWithTalent {
  return {
    ...makePackage({ id: "related-pkg", talent_id: "talent-2" }),
    talent_name: "Related Real Talent",
    talent_slug: "related-real-talent",
    talent_keywords: [],
    ...overrides,
  };
}

describe("TalentDetailContent — cover photo", () => {
  it("renders the cover image in the hero when present", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({ cover_url: "https://example.com/cover.png" })}
        packages={[]}
        relatedPackages={[]}
        reviewSummary={reviewSummary}
      />
    );
    const img = screen.getByAltText("") as HTMLImageElement;
    expect(img.src).toBe("https://example.com/cover.png");
  });
});

describe("TalentDetailContent — Overview tab", () => {
  it("shows real Service Provided entries instead of mock data", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({ services: ["DJ Sets", "Live Vocals"] })}
        packages={[]}
        relatedPackages={[]}
        reviewSummary={reviewSummary}
      />
    );
    expect(screen.getByText("DJ Sets")).toBeInTheDocument();
    expect(screen.getByText("Live Vocals")).toBeInTheDocument();
  });

  it("shows real profile and package content instead of mock talent copy", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({ bio: "The real talent biography." })}
        packages={[makePackage()]}
        relatedPackages={[makeRelatedPackage({ category: "Live Band" })]}
        reviewSummary={reviewSummary}
      />
    );

    expect(screen.getByText("DJ")).toBeInTheDocument();
    expect(screen.getByText("A real package description.")).toBeInTheDocument();
    expect(screen.getByText("The real talent biography.")).toBeInTheDocument();
    expect(screen.getByText("Related Real Talent")).toBeInTheDocument();
    expect(screen.queryByText("Rapper perfoms for music festival, bar, club and pub.")).not.toBeInTheDocument();
  });
});

describe("TalentDetailContent — About Talent tab", () => {
  it("shows social links, location, DOB, genre, and achievements", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({
          location: "Harlem, New York, United State",
          date_of_birth: "1988-10-03",
          genre: "US/UK Hiphop/Rap",
          social_links: [{ platform: "Instagram", url: "https://instagram.com/asaprocky" }],
          achievements: [{ title: "2023 Nominee - BET Award", subtitle: "Video Director of the Year" }],
        })}
        packages={[]}
        relatedPackages={[]}
        reviewSummary={reviewSummary}
      />
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: "About Talent" }));
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Harlem, New York, United State")).toBeInTheDocument();
    // Genre also renders in the persistent hero badge (no packages to source a category from),
    // so it legitimately appears twice on the page.
    expect(screen.getAllByText("US/UK Hiphop/Rap")).toHaveLength(2);
    expect(screen.getByText("2023 Nominee - BET Award")).toBeInTheDocument();
    expect(screen.getByText("Video Director of the Year")).toBeInTheDocument();
  });

  it("shows the real bio and never falls back to another talent's biography", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({ bio: "The profile owner's real story." })}
        packages={[]}
        relatedPackages={[]}
        reviewSummary={reviewSummary}
      />
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: "About Talent" }));
    expect(screen.getByText("The profile owner's real story.")).toBeInTheDocument();
    expect(screen.queryByText(/A\$AP Rocky brings a high-energy live show/)).not.toBeInTheDocument();
  });
});
