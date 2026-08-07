import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { EventListingCard, EventListingRow } from "@/components/shell/event-listing-card";
import type { EventListingSummary } from "@/lib/supabase/types";

afterEach(() => cleanup());

function makeEvent(photo_urls: string[]): EventListingSummary {
  return {
    id: "event-1",
    slug: "summer-fest",
    name: "Summer Fest",
    venue: "ABC Dance Zone",
    address: "HCMC",
    event_date: "2026-09-01",
    start_time: "20:00:00",
    end_time: "21:30:00",
    status: "upcoming",
    organizer_id: "org-1",
    created_at: "2026-08-01T00:00:00Z",
    total_slots: 4,
    filled_slots: 1,
    budget_min_vnd: null,
    budget_max_vnd: null,
    categories: [],
    photo_urls,
  };
}

describe("EventListingCard", () => {
  it("renders the first photo when photo_urls has an image", () => {
    const { container } = render(
      <EventListingCard data={makeEvent(["https://example.com/photo.png"])} />
    );
    expect(container.querySelector('img[src="https://example.com/photo.png"]')).not.toBeNull();
  });

  it("falls back to the placeholder icon when there are no photos", () => {
    const { container } = render(<EventListingCard data={makeEvent([])} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("EventListingRow", () => {
  it("renders the first photo when photo_urls has an image", () => {
    const { container } = render(
      <EventListingRow data={makeEvent(["https://example.com/photo.png"])} />
    );
    expect(container.querySelector('img[src="https://example.com/photo.png"]')).not.toBeNull();
  });

  it("falls back to the placeholder icon when there are no photos", () => {
    const { container } = render(<EventListingRow data={makeEvent([])} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
