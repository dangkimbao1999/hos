import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
mock.module("@/lib/supabase/event-actions", () => ({
  acceptApplication: async () => ({ success: true as const }),
  rejectApplication: async () => ({ success: true as const }),
}));

import { EventApplicationsPanel } from "@/components/account/event-applications-panel";
import type { EventApplicationWithDetails } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeApplication(overrides: Partial<EventApplicationWithDetails> = {}): EventApplicationWithDetails {
  return {
    id: "app-1",
    slot_id: "slot-1",
    applicant_profile_id: "talent-1",
    offer_amount_usd: null,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    slot_category: "Solo Singer",
    slot_price_usd: 500,
    event_id: "event-1",
    event_name: "Test Event",
    event_date: "2026-12-01",
    applicant_name: "Test Talent",
    ...overrides,
  };
}

describe("EventApplicationsPanel — toasts", () => {
  it("shows a success toast when an application is accepted", async () => {
    render(<EventApplicationsPanel applications={[makeApplication()]} />);
    fireEvent.click(screen.getByRole("button", { name: /application/i }));
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Application accepted." });
  });
});
