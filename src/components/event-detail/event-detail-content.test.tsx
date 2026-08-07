import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("@/components/event-detail/apply-panel", () => ({
  ApplyPanel: () => null,
}));

import { EventDetailContent } from "@/components/event-detail/event-detail-content";
import type { EventWithSlots } from "@/lib/supabase/types";

afterEach(() => cleanup());

function makeEvent(overrides: Partial<EventWithSlots> = {}): EventWithSlots {
  return {
    id: "event-1",
    organizer_id: "org-1",
    slug: "test-event",
    name: "Test Event",
    venue: "Test Venue",
    address: "123 Test St",
    event_date: "2026-08-04",
    start_time: "20:00",
    end_time: "22:00",
    tagline: null,
    description: "The event's own description.",
    budget_min_vnd: null,
    budget_max_vnd: null,
    contact_phone: null,
    expected_guests: null,
    special_requirements: null,
    photo_urls: [],
    status: "upcoming",
    created_at: new Date().toISOString(),
    slots: [],
    organizer: { full_name: "", location: null, bio: null, gallery_urls: [], social_links: [] },
    ...overrides,
  };
}

describe("EventDetailContent — About Organizer tab", () => {
  it("shows the organizer's own bio and social links, not the event's description", () => {
    render(
      <EventDetailContent
        role="talent"
        event={makeEvent({
          organizer: {
            full_name: "420 Ent.",
            location: "District 1, Ho Chi Minh City",
            bio: "The organizer's real bio.",
            gallery_urls: [],
            social_links: [{ platform: "Instagram", url: "https://instagram.com/420ent" }],
          },
        })}
        moreEvents={[]}
      />
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: "About Organizer" }));
    expect(screen.getByText("The organizer's real bio.")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.queryByText("The event's own description.")).not.toBeInTheDocument();
  });
});
