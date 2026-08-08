import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { BookingDetail } from "@/lib/supabase/types";

const NOT_FOUND = new Error("NEXT_NOT_FOUND");
mock.module("next/navigation", () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
}));

let bookingResult: BookingDetail | null = null;
mock.module("@/lib/supabase/packages", () => ({
  getBookingDetail: async () => bookingResult,
}));
mock.module("@/components/account/order-detail-content", () => ({
  OrderDetailContent: (props: { role: string; booking: BookingDetail }) => (
    <div data-testid="content">
      {props.role}:{props.booking.package_title}
    </div>
  ),
}));
mock.module("@/components/account/account-shell", () => ({
  AccountShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import OrganizerOrderDetailPage from "@/app/organizer/account/orders/[bookingId]/page";

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
    city_id: null,
    address: null,
    payment_method: "Prepaid",
    status: "pending",
    payment_status: "pending",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    organizer_name: "Test Organizer",
    talent_name: "Test Talent",
    package_title: "Acoustic Set",
    package_description: null,
    package_working_method: null,
    package_skill_tags: [],
    venue_city_name: "HCM City",
    venue_address: null,
    ...overrides,
  };
}

describe("OrganizerOrderDetailPage", () => {
  it("renders OrderDetailContent with the fetched booking, scoped to the organizer role", async () => {
    bookingResult = makeBooking();
    const jsx = await OrganizerOrderDetailPage({ params: Promise.resolve({ bookingId: "booking-1" }) });
    render(jsx);
    expect(screen.getByTestId("content")).toHaveTextContent("organizer:Acoustic Set");
  });

  it("calls notFound when the booking doesn't exist (or isn't visible to this viewer)", async () => {
    bookingResult = null;
    await expect(
      OrganizerOrderDetailPage({ params: Promise.resolve({ bookingId: "missing" }) })
    ).rejects.toThrow(NOT_FOUND);
  });
});
