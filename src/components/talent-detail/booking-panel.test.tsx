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
import type { PackageWithLookupNames } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makePackage(overrides: Partial<PackageWithLookupNames> = {}): PackageWithLookupNames {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category_id: "cat-solo-singer",
    subcategory_id: "cat-rapper",
    category_name: "Solo Singer",
    subcategory_name: "Rapper",
    title: "Acoustic Set",
    residency: null,
    city_id: "city-hcm",
    city_name: "Ho Chi Minh City",
    working_method: null,
    skill_tags: [],
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

const CITIES = [{ id: "city-hcm", name: "HCM City" }];

describe("BookingPanel — toasts", () => {
  it("shows a success toast when added to cart", async () => {
    render(<BookingPanel talentName="Test Talent" packages={[makePackage()]} cities={CITIES} />);
    fireEvent.change(screen.getByLabelText("Booking date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText(/perform city/i), { target: { value: "city-hcm" } });
    fireEvent.change(screen.getByLabelText(/perform address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Added to cart." });
  });

  it("blocks adding to cart without a perform city", async () => {
    render(<BookingPanel talentName="Test Talent" packages={[makePackage()]} cities={CITIES} />);
    fireEvent.change(screen.getByLabelText("Booking date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText(/perform address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(screen.getByText("Select the perform city.")).toBeInTheDocument();
    expect(toastCalls).toEqual([]);
  });

  it("blocks adding to cart without a perform address", async () => {
    render(<BookingPanel talentName="Test Talent" packages={[makePackage()]} cities={CITIES} />);
    fireEvent.change(screen.getByLabelText("Booking date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText(/perform city/i), { target: { value: "city-hcm" } });
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(screen.getByText("Enter the perform address.")).toBeInTheDocument();
    expect(toastCalls).toEqual([]);
  });
});
