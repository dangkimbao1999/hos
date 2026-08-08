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
  deletePackage: async () => ({ success: true as const }),
}));

import { PackagesContent } from "@/components/account/packages-content";
import type { PackageRow } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
  (globalThis as { confirm?: () => boolean }).confirm = () => true;
});

function makePackage(overrides: Partial<PackageRow & { bookingCount: number }> = {}): PackageRow & {
  bookingCount: number;
} {
  return {
    id: "pkg-1",
    talent_id: "talent-1",
    category_id: "cat-solo-singer",
    subcategory_id: "cat-rapper",
    title: "Acoustic Set",
    residency: null,
    city_id: "city-hcm",
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
    bookingCount: 0,
    ...overrides,
  };
}

describe("PackagesContent — toasts", () => {
  it("shows a success toast when a package is deleted", async () => {
    (globalThis as { confirm?: () => boolean }).confirm = () => true;
    render(<PackagesContent role="talent" packages={[makePackage()]} categories={[]} cities={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Package deleted." });
  });
});
