import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

let mockPathname = "/organizer/account/orders";
mock.module("next/navigation", () => ({ usePathname: () => mockPathname }));

import { AccountTabs } from "@/components/account/account-tabs";

afterEach(() => {
  cleanup();
  mockPathname = "/organizer/account/orders";
});

describe("AccountTabs — active state", () => {
  it("highlights the tab on an exact path match", () => {
    render(<AccountTabs role="organizer" />);
    expect(screen.getByRole("link", { name: "My Orders" })).toHaveClass("bg-foreground");
  });

  it("keeps the tab highlighted on a nested route (e.g. an order's detail page)", () => {
    mockPathname = "/organizer/account/orders/booking-42";
    render(<AccountTabs role="organizer" />);
    expect(screen.getByRole("link", { name: "My Orders" })).toHaveClass("bg-foreground");
  });

  it("does not highlight a tab whose href is merely a prefix of another tab's href", () => {
    // "/organizer/account" (My Profile) must not match while on
    // "/organizer/account/orders/booking-42" just because it's a string prefix.
    mockPathname = "/organizer/account/orders/booking-42";
    render(<AccountTabs role="organizer" />);
    expect(screen.getByRole("link", { name: "My Profile" })).not.toHaveClass("bg-foreground");
  });
});
