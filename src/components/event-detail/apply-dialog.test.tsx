import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/event-actions", () => ({
  applyToSlot: async () => ({ success: true as const }),
}));

import { ApplyDialog } from "@/components/event-detail/apply-dialog";
import type { EventSlotRow, EventWithSlots } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

const slot: EventSlotRow = {
  id: "slot-1",
  event_id: "event-1",
  category: "Solo Singer",
  price_usd: 500,
  slot_type: "Fulltime",
  quantity_total: 1,
  created_at: new Date().toISOString(),
};

const event: EventWithSlots = {
  id: "event-1",
  organizer_id: "org-1",
  slug: "test-event",
  name: "Test Event",
  venue: "Test Venue",
  address: "123 Test St",
  event_date: "2026-12-01",
  start_time: "20:00",
  end_time: "22:00",
  tagline: null,
  description: null,
  budget_min_vnd: null,
  budget_max_vnd: null,
  contact_phone: null,
  expected_guests: null,
  special_requirements: null,
  status: "upcoming",
  created_at: new Date().toISOString(),
  slots: [slot],
  organizer: { full_name: "Test Organizer", location: null, bio: null, gallery_urls: [], social_links: [] },
};

describe("ApplyDialog — toasts", () => {
  it("shows a success toast when the application is submitted", async () => {
    render(
      <ApplyDialog event={event} slot={slot} role="talent" open onOpenChange={() => {}} />
    );
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Application submitted." });
  });
});
