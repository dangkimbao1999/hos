import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));

import { OrdersContent } from "@/components/account/orders-content";
import type { BookingWithNames } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
});

function makeBooking(overrides: Partial<BookingWithNames> = {}): BookingWithNames {
  return {
    id: "booking-1",
    package_id: "pkg-1",
    organizer_id: "org-1",
    price_vnd: 5_000_000,
    talent_offer_vnd: 5_000_000,
    organizer_offer_vnd: 5_000_000,
    city_id: null,
    address: null,
    awaiting_response_from: "talent",
    booked_date: "2026-12-01",
    booked_time: "20:00",
    booked_end_time: "21:00",
    payment_method: "Prepaid",
    status: "pending",
    payment_status: "pending",
    talent_marked_complete_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    package_title: "Acoustic Set",
    organizer_name: "Test Organizer",
    talent_name: "Test Talent",
    ...overrides,
  };
}

describe("OrdersContent — order detail link", () => {
  it("links each row to the role's order detail route for that booking", () => {
    render(<OrdersContent role="talent" bookings={[makeBooking({ id: "booking-42" })]} />);
    expect(screen.getByRole("link", { name: /view order details/i })).toHaveAttribute(
      "href",
      "/talent/account/orders/booking-42"
    );
  });
});

describe("OrdersContent — filter tabs", () => {
  const bookings = [
    makeBooking({ id: "pending1-a", status: "pending", organizer_name: "Org Pending" }),
    makeBooking({ id: "confirm1-a", status: "confirmed", organizer_name: "Org Confirmed" }),
    makeBooking({ id: "complete1-a", status: "completed", organizer_name: "Org Completed" }),
    makeBooking({ id: "cancel1-a", status: "cancelled", organizer_name: "Org Cancelled" }),
  ];

  it("shows every order under the All tab", () => {
    render(<OrdersContent role="talent" bookings={bookings} />);
    expect(screen.getByText("Org Pending")).toBeInTheDocument();
    expect(screen.getByText("Org Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Org Completed")).toBeInTheDocument();
    expect(screen.getByText("Org Cancelled")).toBeInTheDocument();
  });

  it("narrows to only that status when a filter tab is clicked", () => {
    render(<OrdersContent role="talent" bookings={bookings} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmed" }));
    expect(screen.getByText("Org Confirmed")).toBeInTheDocument();
    expect(screen.queryByText("Org Pending")).not.toBeInTheDocument();
    expect(screen.queryByText("Org Completed")).not.toBeInTheDocument();
    expect(screen.queryByText("Org Cancelled")).not.toBeInTheDocument();
  });

  it("Upcoming shows only confirmed bookings with a future booked date", () => {
    render(
      <OrdersContent
        role="talent"
        bookings={[
          makeBooking({ id: "future1-a", status: "confirmed", booked_date: "2099-01-01", organizer_name: "Future Org" }),
          makeBooking({ id: "past1-a", status: "confirmed", booked_date: "2020-01-01", organizer_name: "Past Org" }),
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Upcoming" }));
    expect(screen.getByText("Future Org")).toBeInTheDocument();
    expect(screen.queryByText("Past Org")).not.toBeInTheDocument();
  });
});

describe("OrdersContent — search", () => {
  const bookings = [
    makeBooking({ id: "alpha001-x", organizer_name: "Alpha Events" }),
    makeBooking({ id: "beta002-x", organizer_name: "Beta Events" }),
  ];

  it("filters by counterpart name", () => {
    render(<OrdersContent role="talent" bookings={bookings} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "alpha" } });
    expect(screen.getByText("Alpha Events")).toBeInTheDocument();
    expect(screen.queryByText("Beta Events")).not.toBeInTheDocument();
  });

  it("filters by order id", () => {
    render(<OrdersContent role="talent" bookings={bookings} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "beta002" } });
    expect(screen.getByText("Beta Events")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Events")).not.toBeInTheDocument();
  });
});
