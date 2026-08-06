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
mock.module("@/lib/supabase/package-actions", () => ({
  acceptBooking: async () => ({ success: true as const }),
  rejectBooking: async () => ({ success: true as const }),
}));

import { OrdersContent } from "@/components/account/orders-content";
import type { BookingWithNames } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeBooking(overrides: Partial<BookingWithNames> = {}): BookingWithNames {
  return {
    id: "booking-1",
    package_id: "pkg-1",
    organizer_id: "org-1",
    price_vnd: 5_000_000,
    booked_date: "2026-12-01",
    booked_time: "20:00",
    payment_method: "Prepaid",
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    package_title: "Acoustic Set",
    organizer_name: "Test Organizer",
    talent_name: "Test Talent",
    ...overrides,
  };
}

describe("OrdersContent — toasts", () => {
  it("shows a success toast when a booking is accepted", async () => {
    render(<OrdersContent role="talent" bookings={[makeBooking()]} />);
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Booking accepted." });
  });
});
