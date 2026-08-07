import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const pushCalls: string[] = [];
mock.module("next/navigation", () => ({
  useRouter: () => ({ push: (url: string) => pushCalls.push(url) }),
}));
mock.module("@/components/shell/notification-button", () => ({ NotificationButton: () => null }));
mock.module("@/components/shell/cart-button", () => ({ CartButton: () => null }));
mock.module("@/components/shell/profile-menu", () => ({ ProfileMenu: () => null }));

import { Topbar } from "@/components/shell/topbar";

afterEach(() => {
  cleanup();
  pushCalls.length = 0;
});

describe("Topbar — header search", () => {
  it("navigates to the role's Discover page with ?q= on Enter", () => {
    render(<Topbar role="organizer" userName="Test" notifications={[]} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "DJ Nova" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(pushCalls).toEqual(["/organizer/discover?q=DJ%20Nova"]);
  });

  it("uses the talent/agency role's own Discover route", () => {
    render(<Topbar role="talent" userName="Test" notifications={[]} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "Summer Fest" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(pushCalls).toEqual(["/talent/discover?q=Summer%20Fest"]);
  });

  it("does not navigate on an empty query", () => {
    render(<Topbar role="organizer" userName="Test" notifications={[]} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/search/i), { key: "Enter" });
    expect(pushCalls).toEqual([]);
  });
});
