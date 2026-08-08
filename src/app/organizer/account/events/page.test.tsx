import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { EventApplicationWithDetails, EventListingSummary } from "@/lib/supabase/types";

mock.module("@/lib/supabase/server", () => ({
  getCurrentProfile: async () => ({ id: "org-1" }),
}));
mock.module("@/lib/supabase/reviews", () => ({
  listReviewedSourceIds: async () => ({ bookingIds: new Set(), applicationIds: new Set() }),
}));

let pageArgs: { organizerId: string; page: number } | null = null;
let pageResult: { events: EventListingSummary[]; totalCount: number } = { events: [], totalCount: 0 };
mock.module("@/lib/supabase/events", () => ({
  listOrganizerEventsPage: async (organizerId: string, page: number) => {
    pageArgs = { organizerId, page };
    return pageResult;
  },
  listApplicationsForOrganizer: async () => [] as EventApplicationWithDetails[],
}));
mock.module("@/components/account/account-shell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
mock.module("@/components/account/event-applications-panel", () => ({
  EventApplicationsPanel: () => null,
}));

import OrganizerEventsPage from "@/app/organizer/account/events/page";

function makeEvent(overrides: Partial<EventListingSummary> = {}): EventListingSummary {
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
    categories: [],
    photo_urls: [],
    ...overrides,
  };
}

describe("OrganizerEventsPage", () => {
  it("fetches the current page of events and renders them, showing the true total count", async () => {
    pageResult = { events: [makeEvent({ name: "Ravolution" })], totalCount: 25 };
    const jsx = await OrganizerEventsPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByText("Ravolution")).toBeInTheDocument();
    expect(screen.getByText("25 events created")).toBeInTheDocument();
    expect(pageArgs).toEqual({ organizerId: "org-1", page: 1 });
  });

  it("resolves the page number from ?page= and links pagination to adjacent pages", async () => {
    pageResult = { events: [], totalCount: 25 };
    render(await OrganizerEventsPage({ searchParams: Promise.resolve({ page: "2" }) }));
    expect(pageArgs).toEqual({ organizerId: "org-1", page: 2 });
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("href", "/organizer/account/events?page=3");
  });
});
