import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/review-actions", () => ({
  submitReview: async () => ({ success: true as const }),
}));

import { ReviewDialog } from "@/components/shared/review-dialog";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("ReviewDialog — toasts", () => {
  it("shows a success toast when a review is submitted", async () => {
    render(
      <ReviewDialog
        open
        onOpenChange={() => {}}
        sourceType="booking"
        sourceId="booking-1"
        talentName="Test Talent"
        onSubmitted={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Review submitted." });
  });
});
