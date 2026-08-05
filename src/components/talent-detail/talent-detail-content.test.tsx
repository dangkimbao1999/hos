import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("@/components/talent-detail/booking-panel", () => ({
  BookingPanel: () => null,
}));
mock.module("@/components/talent-detail/request-quote-dialog", () => ({
  RequestQuoteDialog: () => null,
}));

import { TalentDetailContent } from "@/components/talent-detail/talent-detail-content";
import type { Profile } from "@/lib/supabase/types";
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

describe("TalentDetailContent — cover photo", () => {
  it("renders the cover image in the hero when present", () => {
    render(
      <TalentDetailContent
        talent={makeTalent({ cover_url: "https://example.com/cover.png" })}
        packages={[]}
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
        reviewSummary={reviewSummary}
      />
    );
    expect(screen.getByText("DJ Sets")).toBeInTheDocument();
    expect(screen.getByText("Live Vocals")).toBeInTheDocument();
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
        reviewSummary={reviewSummary}
      />
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: "About Talent" }));
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Harlem, New York, United State")).toBeInTheDocument();
    expect(screen.getByText("US/UK Hiphop/Rap")).toBeInTheDocument();
    expect(screen.getByText("2023 Nominee - BET Award")).toBeInTheDocument();
    expect(screen.getByText("Video Director of the Year")).toBeInTheDocument();
  });
});
