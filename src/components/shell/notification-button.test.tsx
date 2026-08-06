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
    render(<NotificationButton notifications={notifications} />);
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
    render(<NotificationButton notifications={notifications} />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toastCalls).toEqual([]);
  });
});
