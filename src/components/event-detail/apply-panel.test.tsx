import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { EventWithSlots } from "@/lib/supabase/types";

mock.module("@/components/event-detail/apply-dialog", () => ({
  ApplyDialog: () => null,
}));

import { ApplyPanel } from "@/components/event-detail/apply-panel";

afterEach(() => cleanup());

function makeEvent(overrides: Partial<EventWithSlots> = {}): EventWithSlots {
  return {
    id: "event-1",
    organizer_id: "org-1",
    slug: "test-event",
    name: "Test Event",
    venue: "Test Venue",
    address: "123 Test St",
    event_date: "2026-09-01",
    start_time: "20:00",
    end_time: "22:00",
    tagline: null,
    description: null,
    budget_min_vnd: null,
    budget_max_vnd: null,
    contact_phone: null,
    expected_guests: null,
    special_requirements: null,
    photo_urls: [],
    status: "upcoming",
    created_at: new Date().toISOString(),
    slots: [],
    organizer: { full_name: "", city_name: null, bio: null, gallery_urls: [], social_links: [] },
    ...overrides,
  };
}

describe("ApplyPanel", () => {
  it("renders each slot's resolved category name", () => {
    render(
      <ApplyPanel
        role="talent"
        event={makeEvent({
          slots: [
            {
              id: "slot-1",
              event_id: "event-1",
              category_id: "cat-dj",
              category_name: "DJ",
              price_usd: 500,
              slot_type: "Fulltime",
              quantity_total: 1,
              created_at: new Date().toISOString(),
            },
          ],
        })}
      />
    );
    expect(screen.getByText("DJ")).toBeInTheDocument();
  });

  it("shows a fallback message when there are no open slots", () => {
    render(<ApplyPanel role="talent" event={makeEvent({ slots: [] })} />);
    expect(screen.getByText("No open slots for this event yet.")).toBeInTheDocument();
  });
});
