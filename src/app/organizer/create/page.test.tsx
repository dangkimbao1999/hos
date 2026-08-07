import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

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

mock.module("@/lib/supabase/storage-actions", () => ({
  uploadEventPhoto: async () => ({
    success: true,
    path: "user-1/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png",
    url: "https://example.com/event-photo.png",
  }),
  removeEventPhoto: async () => ({ success: true }),
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

describe("CreateEventPage — event photos", () => {
  it("uploads a selected file, shows its preview, and removes it through storage", async () => {
    render(<CreateEventPage />);

    const detailsForm = screen.getByLabelText("Event Name").closest("form");
    expect(detailsForm).not.toBeNull();
    fireEvent.submit(detailsForm!);

    expect(screen.getByRole("heading", { name: "Add Photos" })).toBeInTheDocument();
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(inputs).toHaveLength(10);

    fireEvent.change(inputs[0], {
      target: { files: [new File(["photo"], "venue.png", { type: "image/png" })] },
    });

    await waitFor(() => {
      expect(screen.getByText("Photo 1 uploaded")).toBeInTheDocument();
    });
    expect(document.querySelector('img[src="https://example.com/event-photo.png"]')).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Remove Photo 1 uploaded" }));
    await waitFor(() => {
      expect(screen.getByText("Add Photo 1")).toBeInTheDocument();
    });
  });
});
