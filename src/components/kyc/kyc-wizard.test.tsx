import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/kyc-actions", () => ({
  submitKyc: async () => ({ success: true as const }),
}));
mock.module("@/lib/supabase/storage-actions", () => ({
  uploadKycDocument: async () => ({ success: true as const, path: "user-1/id-front-123.jpg" }),
}));

import { KycWizard } from "@/components/kyc/kyc-wizard";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("KycWizard — toasts", () => {
  it("shows a success toast when a document uploads", async () => {
    render(<KycWizard role="talent" />);
    // role="talent" -> individual flow, starts on "Personal Info". All
    // fields are required, so all must be filled before "Next Step"
    // actually advances the step.
    fireEvent.change(screen.getByPlaceholderText("Dang Kim Bao"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("Date of Birth"), { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByPlaceholderText("Vietnamese"), { target: { value: "Vietnamese" } });
    fireEvent.change(screen.getByPlaceholderText("079xxxxxxxxx"), { target: { value: "079123456789" } });
    fireEvent.change(screen.getByPlaceholderText("114 Nam Ky Khoi Nghia Str, HCMC"), {
      target: { value: "123 Test St" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));

    // Now on "ID Document" — UploadSlot's <input type="file"> is visually
    // hidden with no accessible name, so it can't be queried by role/label;
    // the first file input in the DOM at this step is the "id-front" slot.
    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    const file = new File(["id-front"], "id-front.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Document uploaded." });
  });
});
