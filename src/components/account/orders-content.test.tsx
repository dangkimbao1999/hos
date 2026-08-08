import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

let mockSearchParams = new URLSearchParams();
let replaceCalls: string[] = [];
mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaceCalls.push(href), refresh: () => {} }),
  usePathname: () => "/talent/account/orders",
  useSearchParams: () => mockSearchParams,
}));

import { OrdersContent } from "@/components/account/orders-content";
import type { BookingWithNames } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  mockSearchParams = new URLSearchParams();
  replaceCalls = [];
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

describe("OrdersContent — status tabs navigate via the URL", () => {
  it("clicking a tab replaces the URL with ?status=, dropping any ?page=", () => {
    mockSearchParams = new URLSearchParams("page=3");
    render(<OrdersContent role="talent" bookings={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmed" }));
    expect(replaceCalls).toEqual(["/talent/account/orders?status=Confirmed"]);
  });

  it("clicking All clears the status param entirely", () => {
    mockSearchParams = new URLSearchParams("status=Confirmed");
    render(<OrdersContent role="talent" bookings={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(replaceCalls).toEqual(["/talent/account/orders"]);
  });

  it("reflects the ?status= URL param as the active tab", () => {
    mockSearchParams = new URLSearchParams("status=Confirmed");
    render(<OrdersContent role="talent" bookings={[]} />);
    expect(screen.getByRole("button", { name: "Confirmed" })).toHaveClass("bg-foreground");
    expect(screen.getByRole("button", { name: "All" })).not.toHaveClass("bg-foreground");
  });
});

describe("OrdersContent — search debounces into the URL", () => {
  it("navigates to ?q=<value> only after the debounce, not on every keystroke", async () => {
    render(<OrdersContent role="talent" bookings={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "alpha" } });
    expect(replaceCalls).toEqual([]);
    await waitFor(
      () => {
        expect(replaceCalls).toEqual(["/talent/account/orders?q=alpha"]);
      },
      { timeout: 1500 }
    );
  });
});

describe("OrdersContent — empty states", () => {
  it('shows "No orders yet." when there are no orders and no filters are active', () => {
    render(<OrdersContent role="talent" bookings={[]} />);
    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
  });

  it('shows "No orders match your filters." when a filter is active', () => {
    mockSearchParams = new URLSearchParams("status=Confirmed");
    render(<OrdersContent role="talent" bookings={[]} />);
    expect(screen.getByText("No orders match your filters.")).toBeInTheDocument();
  });
});

describe("OrdersContent — pagination", () => {
  it("renders a pagination control when currentPage/totalPages are given", () => {
    render(<OrdersContent role="talent" bookings={[makeBooking()]} currentPage={1} totalPages={3} />);
    expect(screen.getByRole("navigation", { name: /pagination/i })).toBeInTheDocument();
  });

  it("renders no pagination control in mock mode (currentPage/totalPages omitted)", () => {
    render(<OrdersContent role="agency" />);
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });
});
