import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
mock.module("@/lib/supabase/actions", () => ({
  requestPasswordReset: async () => ({ success: true as const }),
  updatePassword: async () => ({ success: true as const }),
}));

import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("ForgotPasswordPage", () => {
  it("shows a success toast when a reset link is requested", async () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("test@gmail.com"), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await screen.findByText("Check your Email");
    expect(toastCalls).toContainEqual({ type: "success", message: "Reset link sent." });
  });
});
