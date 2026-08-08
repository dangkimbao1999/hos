import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/quotation-actions", () => ({
  requestQuotation: async () => ({ success: true as const }),
}));

import { RequestQuoteDialog } from "@/components/talent-detail/request-quote-dialog";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

const CITIES = [{ id: "city-hcm", name: "HCM City" }];

describe("RequestQuoteDialog — toasts", () => {
  it("shows a success toast when a quote request is sent", async () => {
    render(<RequestQuoteDialog talentId="talent-1" talentName="Test Talent" cities={CITIES} />);
    fireEvent.click(screen.getByRole("button", { name: /request a quote/i }));
    fireEvent.change(screen.getByPlaceholderText("Private Wedding Reception"), {
      target: { value: "My Event" },
    });
    fireEvent.change(screen.getByLabelText(/perform city/i), { target: { value: "city-hcm" } });
    fireEvent.change(screen.getByLabelText(/perform address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByRole("button", { name: /send request/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({ type: "success", message: "Quote request sent." });
  });
});
