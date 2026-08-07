import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/package-actions", () => ({
  createPackage: async () => ({ success: true as const }),
  updatePackage: async () => ({ success: true as const }),
}));

import { CreatePackageDialog } from "@/components/create-package/create-package-dialog";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("CreatePackageDialog — toasts", () => {
  it("shows a success toast when a package is created", async () => {
    render(<CreatePackageDialog role="talent" open onOpenChange={() => {}} categories={[]} cities={[]} />);
    // role="talent" is not agency, so the dialog opens directly on the
    // "form" step (see the isAgency ? "choose-talent" : "form" initial
    // state) — no talent-selection step to click through first.
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Acoustic Set" } });
    fireEvent.change(screen.getByLabelText("Start Date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("End Date"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "20:00" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "22:00" } });
    fireEvent.change(screen.getByLabelText("Price Min"), { target: { value: "5000000" } });
    fireEvent.change(screen.getByLabelText("Price Max"), { target: { value: "10000000" } });
    fireEvent.click(screen.getByRole("button", { name: /create new package/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Package created." });
  });
});
