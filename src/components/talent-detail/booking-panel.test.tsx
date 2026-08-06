import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));
mock.module("@/lib/supabase/package-actions", () => ({
  addToCart: async () => ({ success: true as const }),
}));

import { BookingPanel } from "@/components/talent-detail/booking-panel";
import type { PackageRow } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makePackage(overrides: Partial<PackageRow> = {}): PackageRow {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category: "Solo Singer",
    sub_category: "Rapper",
    title: "Acoustic Set",
    residency: null,
    location: "Ho Chi Minh City",
    repeat_on: false,
    repeat_days: null,
    start_date: "2026-12-01",
    end_date: "2026-12-01",
    start_time: "20:00",
    end_time: "22:00",
    description: null,
    price_min_vnd: 5_000_000,
    price_max_vnd: 10_000_000,
    payment_method: "Prepaid",
    status: "active",
    is_most_popular: false,
    is_editor_choice: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("BookingPanel — toasts", () => {
  it("shows a success toast when added to cart", async () => {
    render(<BookingPanel talentName="Test Talent" packages={[makePackage()]} />);
    fireEvent.change(screen.getByLabelText("Booking date"), { target: { value: "2026-12-01" } });
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Added to cart." });
  });
});
