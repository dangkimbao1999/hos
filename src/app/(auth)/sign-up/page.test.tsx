import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/actions", () => ({
  signUp: async () => ({ success: true as const }),
  resendSignUpEmail: async () => ({ success: true as const }),
}));

import SignUpPage from "@/app/(auth)/sign-up/page";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("SignUpPage", () => {
  it("shows a success toast when sign-up succeeds", async () => {
    render(<SignUpPage />);
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));
    fireEvent.change(screen.getByPlaceholderText("Organizer Test"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("test@gmail.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••••"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    await screen.findByText("Verify your Email");
    expect(toastCalls).toContainEqual({
      type: "success",
      message: "Account created — check your email to confirm.",
    });
  });
});
