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
mock.module("@/lib/supabase/quotation-actions", () => ({
  acceptQuotation: async () => ({ success: true as const }),
  declineQuotation: async () => ({ success: true as const }),
  rejectQuotation: async () => ({ success: true as const }),
  respondToQuotation: async () => ({ success: true as const }),
}));

import { QuotationsContent } from "@/components/account/quotations-content";
import type { QuotationWithNames } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeQuotation(overrides: Partial<QuotationWithNames> = {}): QuotationWithNames {
  return {
    id: "quote-1",
    organizer_id: "org-1",
    talent_id: "talent-1",
    event_name: "Wedding",
    event_date: "2026-12-01",
    venue: "Riverside Palace",
    description: null,
    budget_min_vnd: null,
    budget_max_vnd: null,
    status: "quoted",
    quoted_price_vnd: 10_000_000,
    talent_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organizer_name: "Test Organizer",
    talent_name: "Test Talent",
    ...overrides,
  };
}

describe("QuotationsContent — toasts", () => {
  it("shows a success toast when an organizer accepts a quote", async () => {
    render(<QuotationsContent role="organizer" quotations={[makeQuotation()]} />);
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Quotation accepted." });
  });
});
