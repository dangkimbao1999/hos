import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
const refresh = mock(() => {});
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

let confirmResult: { error: string } | { success: true } = { success: true as const };
let counterResult: { error: string } | { success: true } = { success: true as const };
let cancelResult: { error: string } | { success: true } = { success: true as const };
const confirmCalls: string[] = [];
const counterCalls: { bookingId: string; offerVnd: string | null }[] = [];
const cancelCalls: string[] = [];
mock.module("@/lib/supabase/package-actions", () => ({
  confirmBookingOffer: async (bookingId: string) => {
    confirmCalls.push(bookingId);
    return confirmResult;
  },
  submitCounterOffer: async (bookingId: string, formData: FormData) => {
    counterCalls.push({ bookingId, offerVnd: formData.get("offerVnd") as string | null });
    return counterResult;
  },
  rejectBooking: async (bookingId: string) => {
    cancelCalls.push(bookingId);
    return cancelResult;
  },
}));

import { OrderDetailContent } from "@/components/account/order-detail-content";
import type { BookingDetail } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
  confirmCalls.length = 0;
  counterCalls.length = 0;
  cancelCalls.length = 0;
  confirmResult = { success: true as const };
  counterResult = { success: true as const };
  cancelResult = { success: true as const };
  refresh.mockClear();
});

function makeBooking(overrides: Partial<BookingDetail> = {}): BookingDetail {
  return {
    id: "booking-1",
    package_id: "pkg-1",
    organizer_id: "org-1",
    price_vnd: 5_000_000,
    talent_offer_vnd: 5_000_000,
    organizer_offer_vnd: 5_000_000,
    awaiting_response_from: "talent",
    booked_date: "2026-12-01",
    booked_time: "20:00",
    booked_end_time: "21:00",
    city_id: "city-hcm",
    address: "123 Main St",
    payment_method: "Prepaid",
    status: "pending",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    organizer_name: "Test Organizer",
    talent_name: "Test Talent",
    package_title: "Acoustic Set",
    package_description: "A chill acoustic set.",
    package_working_method: "Freelance",
    package_skill_tags: ["Guitar", "Vocals"],
    venue_city_name: "HCM City",
    venue_address: "123 Main St",
    ...overrides,
  };
}

describe("OrderDetailContent — display", () => {
  it("shows both parties' names, the package detail, and skill tags", () => {
    render(<OrderDetailContent role="talent" booking={makeBooking()} />);
    expect(screen.getByText("Test Organizer")).toBeInTheDocument();
    expect(screen.getByText("Test Talent")).toBeInTheDocument();
    expect(screen.getByText("Acoustic Set")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Freelance")).toBeInTheDocument();
    expect(screen.getByText("Guitar")).toBeInTheDocument();
    expect(screen.getByText("Vocals")).toBeInTheDocument();
  });

  it("shows the specific booked start-end time, not the package's availability window", () => {
    render(<OrderDetailContent role="talent" booking={makeBooking({ booked_time: "14:00", booked_end_time: "15:00" })} />);
    expect(screen.getByText("14:00 - 15:00")).toBeInTheDocument();
  });

  it("falls back to Flexible when no specific time was booked", () => {
    render(<OrderDetailContent role="talent" booking={makeBooking({ booked_time: null, booked_end_time: null })} />);
    expect(screen.getByText("Flexible")).toBeInTheDocument();
  });
});

describe("OrderDetailContent — whose turn it is", () => {
  it("enables Confirm/Add New Offer for the talent when it's the talent's turn", () => {
    render(<OrderDetailContent role="talent" booking={makeBooking({ awaiting_response_from: "talent" })} />);
    expect(screen.getByRole("button", { name: /order confirm/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /add new offer/i })).toBeEnabled();
  });

  it("disables Confirm/Add New Offer for the organizer and shows a waiting message when it's the talent's turn", () => {
    render(<OrderDetailContent role="organizer" booking={makeBooking({ awaiting_response_from: "talent" })} />);
    expect(screen.getByRole("button", { name: /order confirm/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /add new offer/i })).toBeDisabled();
    expect(screen.getByText(/waiting for talent/i)).toBeInTheDocument();
  });

  it("keeps Cancel enabled even when it isn't the viewer's turn", () => {
    render(<OrderDetailContent role="organizer" booking={makeBooking({ awaiting_response_from: "talent" })} />);
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeEnabled();
  });

  it("hides the negotiation actions once the booking is confirmed", () => {
    render(
      <OrderDetailContent
        role="talent"
        booking={makeBooking({ status: "confirmed", awaiting_response_from: null })}
      />
    );
    expect(screen.queryByRole("button", { name: /order confirm/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add new offer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^cancel$/i })).not.toBeInTheDocument();
  });
});

describe("OrderDetailContent — actions", () => {
  it("confirms the offer and refreshes on success", async () => {
    render(<OrderDetailContent role="talent" booking={makeBooking()} />);
    fireEvent.click(screen.getByRole("button", { name: /order confirm/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(confirmCalls).toEqual(["booking-1"]);
    expect(toastCalls).toContainEqual({ type: "success", message: "Order confirmed." });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows an error toast without refreshing when confirm fails", async () => {
    confirmResult = { error: "It's not your turn to respond to this offer." };
    render(<OrderDetailContent role="talent" booking={makeBooking()} />);
    fireEvent.click(screen.getByRole("button", { name: /order confirm/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({
      type: "error",
      message: "It's not your turn to respond to this offer.",
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("opens the counter-offer modal and submits the entered amount", async () => {
    render(<OrderDetailContent role="talent" booking={makeBooking()} />);
    fireEvent.click(screen.getByRole("button", { name: /add new offer/i }));
    fireEvent.change(screen.getByLabelText(/your offer/i), { target: { value: "6000000" } });
    fireEvent.click(screen.getByRole("button", { name: /send offer request/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(counterCalls).toEqual([{ bookingId: "booking-1", offerVnd: "6000000" }]);
    expect(toastCalls).toContainEqual({ type: "success", message: "Offer sent." });
    expect(refresh).toHaveBeenCalled();
  });

  it("cancels the booking on Cancel click", async () => {
    render(<OrderDetailContent role="talent" booking={makeBooking()} />);
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(cancelCalls).toEqual(["booking-1"]);
    expect(toastCalls).toContainEqual({ type: "success", message: "Booking cancelled." });
    expect(refresh).toHaveBeenCalled();
  });
});
