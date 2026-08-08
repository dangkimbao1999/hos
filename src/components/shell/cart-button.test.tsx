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
  removeFromCart: async () => ({ success: true as const }),
}));

import { CartButton } from "@/components/shell/cart-button";
import type { CartItemWithPackage } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

function makeCartItem(overrides: Partial<CartItemWithPackage> = {}): CartItemWithPackage {
  return {
    id: "cart-1",
    organizer_id: "org-1",
    package_id: "pkg-1",
    price_vnd: 5_000_000,
    booked_date: "2026-12-01",
    booked_time: "20:00",
    booked_end_time: "21:00",
    city_id: null,
    address: null,
    created_at: new Date().toISOString(),
    package: { id: "pkg-1", title: "Acoustic Set", city_name: "Ho Chi Minh City" },
    talent: { id: "talent-1", full_name: "Test Talent" },
    ...overrides,
  };
}

describe("CartButton — toasts", () => {
  it("shows a success toast when an item is removed from the cart", async () => {
    render(<CartButton role="organizer" cartItems={[makeCartItem()]} />);
    fireEvent.click(screen.getByRole("button", { name: /cart/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove item/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Removed from cart." });
  });
});
