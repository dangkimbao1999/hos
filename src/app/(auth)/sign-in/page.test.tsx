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
  signIn: async () => ({ error: "Invalid email or password." }),
}));
mock.module("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth: async () => ({ error: null }) } }),
}));

import SignInPage from "@/app/(auth)/sign-in/page";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("SignInPage", () => {
  it("shows an error toast when sign-in fails", async () => {
    render(<SignInPage />);
    fireEvent.change(screen.getByPlaceholderText("test@gmail.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••••"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText("Invalid email or password.");
    expect(toastCalls).toContainEqual({ type: "error", message: "Invalid email or password." });
  });
});
