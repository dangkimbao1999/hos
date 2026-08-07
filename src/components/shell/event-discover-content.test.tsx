import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EventDiscoverContent } from "@/components/shell/event-discover-content";
import type { EventListingSummary } from "@/lib/supabase/types";

afterEach(() => cleanup());

function makeListing(overrides: Partial<EventListingSummary> = {}): EventListingSummary {
  return {
    id: "event-1",
    slug: "test-event",
    name: "Test Event",
    venue: "Test Venue",
    address: "123 Test St",
    event_date: "2026-09-01",
    start_time: "20:00",
    end_time: "22:00",
    status: "upcoming",
    organizer_id: "org-1",
    created_at: "2026-08-01T00:00:00Z",
    total_slots: 1,
    filled_slots: 0,
    budget_min_vnd: null,
    budget_max_vnd: null,
    categories: ["DJ"],
    photo_urls: [],
    ...overrides,
  };
}

const CATEGORIES = [
  { id: "cat-dj", name: "DJ", subcategories: [] },
  { id: "cat-band", name: "Band", subcategories: [] },
];

describe("EventDiscoverContent", () => {
  it("filters listings by category name sourced from the categories prop", async () => {
    render(
      <EventDiscoverContent
        role="talent"
        listings={[
          makeListing({ id: "event-dj", name: "DJ Event", categories: ["DJ"] }),
          makeListing({ id: "event-band", name: "Band Event", categories: ["Band"] }),
        ]}
        categories={CATEGORIES}
      />
    );
    expect(screen.getByText("DJ Event")).toBeInTheDocument();
    expect(screen.getByText("Band Event")).toBeInTheDocument();

    const trigger = screen.getByText("Category").closest("button")!;
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText("Band"));

    expect(screen.queryByText("DJ Event")).not.toBeInTheDocument();
    expect(screen.getByText("Band Event")).toBeInTheDocument();
  });
});
