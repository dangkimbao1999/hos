import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
let markNotificationsReadResult: { error: string } | { success: true } = {
  error: "Could not mark notifications read.",
};
mock.module("@/lib/supabase/notification-actions", () => ({
  markNotificationsRead: async () => markNotificationsReadResult,
}));

import { NotificationButton } from "@/components/shell/notification-button";
import type { NotificationItem } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
  markNotificationsReadResult = { error: "Could not mark notifications read." };
});

describe("NotificationButton — toasts", () => {
  it("shows an error toast if marking notifications read fails", async () => {
    markNotificationsReadResult = { error: "Could not mark notifications read." };
    const notifications: NotificationItem[] = [
      { id: "n1", kind: "booking_status", message: "Test", time: "1h ago", unread: true },
    ];
    render(<NotificationButton role="organizer" notifications={notifications} />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toContainEqual({
      type: "error",
      message: "Could not mark notifications read.",
    });
  });

  it("shows no toast when marking notifications read succeeds", async () => {
    markNotificationsReadResult = { success: true as const };
    const notifications: NotificationItem[] = [
      { id: "n1", kind: "booking_status", message: "Test", time: "1h ago", unread: true },
    ];
    render(<NotificationButton role="organizer" notifications={notifications} />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toEqual([]);
  });
});

describe("NotificationButton — clicking a notification navigates to what it's about", () => {
  it("links application_received (organizer) to My Events", async () => {
    markNotificationsReadResult = { success: true as const };
    render(
      <NotificationButton
        role="organizer"
        notifications={[
          { id: "n1", kind: "application_received", message: "Test", time: "1h ago", unread: false },
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("link", { name: /test/i })).toHaveAttribute("href", "/organizer/account/events");
  });

  it("links application_status (talent) to Schedule", async () => {
    markNotificationsReadResult = { success: true as const };
    render(
      <NotificationButton
        role="talent"
        notifications={[{ id: "n1", kind: "application_status", message: "Test", time: "1h ago", unread: false }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("link", { name: /test/i })).toHaveAttribute("href", "/talent/account/schedule");
  });

  it("links booking_received (talent) to Orders", async () => {
    markNotificationsReadResult = { success: true as const };
    render(
      <NotificationButton
        role="talent"
        notifications={[{ id: "n1", kind: "booking_received", message: "Test", time: "1h ago", unread: false }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("link", { name: /test/i })).toHaveAttribute("href", "/talent/account/orders");
  });

  it("links booking_status (organizer) to Orders", async () => {
    markNotificationsReadResult = { success: true as const };
    render(
      <NotificationButton
        role="organizer"
        notifications={[{ id: "n1", kind: "booking_status", message: "Test", time: "1h ago", unread: false }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("link", { name: /test/i })).toHaveAttribute("href", "/organizer/account/orders");
  });

  it("links quotation_received (talent) to Quotations", async () => {
    markNotificationsReadResult = { success: true as const };
    render(
      <NotificationButton
        role="talent"
        notifications={[{ id: "n1", kind: "quotation_received", message: "Test", time: "1h ago", unread: false }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("link", { name: /test/i })).toHaveAttribute("href", "/talent/account/quotations");
  });

  it("links quotation_responded (organizer) to Quotations", async () => {
    markNotificationsReadResult = { success: true as const };
    render(
      <NotificationButton
        role="organizer"
        notifications={[{ id: "n1", kind: "quotation_responded", message: "Test", time: "1h ago", unread: false }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("link", { name: /test/i })).toHaveAttribute("href", "/organizer/account/quotations");
  });

  it("links kyc_status to the role's KYC page", async () => {
    markNotificationsReadResult = { success: true as const };
    render(
      <NotificationButton
        role="talent"
        notifications={[{ id: "n1", kind: "kyc_status", message: "Test", time: "1h ago", unread: false }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("link", { name: /test/i })).toHaveAttribute("href", "/talent/kyc");
  });
});
