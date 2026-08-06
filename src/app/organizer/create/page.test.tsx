import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/event-actions", () => ({
  createEvent: async () => ({ success: true as const, slug: "test-event" }),
}));

import CreateEventPage from "@/app/organizer/create/page";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("CreateEventPage — toasts", () => {
  it("shows a success toast when the event is created", async () => {
    render(<CreateEventPage />);

    // Step 1: "Event Details" — Event Name/Date/Time/Venue are required.
    fireEvent.change(screen.getByPlaceholderText("Summer Music Festival"), {
      target: { value: "Test Event" },
    });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "20:00" } });
    fireEvent.change(screen.getByPlaceholderText("ABC Dance Zone, HCMC"), {
      target: { value: "Test Venue" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));

    // Step 2: "Add Photos" — nothing required.
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));

    // Step 3: "Review & Budget" — Budget Min/Max and the one default talent
    // slot's Category/Price/Needed are all required.
    fireEvent.change(screen.getByPlaceholderText("10,000,000"), { target: { value: "10000000" } });
    fireEvent.change(screen.getByPlaceholderText("50,000,000"), { target: { value: "50000000" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Solo Singer" } });
    fireEvent.change(screen.getByLabelText("Price per Talent (USD)"), { target: { value: "500" } });
    fireEvent.change(screen.getByLabelText("Needed"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Event created." });
  });
});
