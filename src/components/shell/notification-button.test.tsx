import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const toastCalls: { type: "error" | "success"; message: string }[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (message: string) => toastCalls.push({ type: "error", message }),
    success: (message: string) => toastCalls.push({ type: "success", message }),
  },
}));
mock.module("@/lib/supabase/notification-actions", () => ({
  markNotificationsRead: async () => ({ error: "Could not mark notifications read." }),
}));

import { NotificationButton } from "@/components/shell/notification-button";
import type { NotificationItem } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  toastCalls.length = 0;
});

describe("NotificationButton — toasts", () => {
  it("shows an error toast if marking notifications read fails, but no toast on success", async () => {
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
});
