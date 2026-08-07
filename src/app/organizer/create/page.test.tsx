import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

mock.module("@/lib/supabase/event-actions", () => ({
  createEvent: async () => ({ success: true, slug: "test-event" }),
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

afterEach(() => cleanup());

describe("CreateEventPage — event photos", () => {
  it("uploads a selected file, shows its preview, and removes it through storage", async () => {
    render(<CreateEventPage />);

    const detailsForm = screen.getByLabelText("Event Name").closest("form");
    expect(detailsForm).not.toBeNull();
    fireEvent.submit(detailsForm!);

    expect(screen.getByRole("heading", { name: "Add Photos" })).toBeInTheDocument();
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(inputs).toHaveLength(3);

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
