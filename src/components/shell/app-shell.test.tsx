import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption } from "@/lib/supabase/types";

mock.module("@/components/shell/sidebar", () => ({
  Sidebar: (props: { categories: CategoryOption[]; cities: LookupOption[] }) => (
    <div data-testid="sidebar">
      {props.categories.map((c) => c.name).join(",")}|{props.cities.map((c) => c.name).join(",")}
    </div>
  ),
}));
mock.module("@/components/shell/topbar", () => ({ Topbar: () => null }));
mock.module("@/components/shell/kyc-banner", () => ({ KycBanner: () => null }));

import { AppShell } from "@/components/shell/app-shell";

afterEach(() => cleanup());

describe("AppShell", () => {
  it("passes categories and cities through to the Sidebar", () => {
    render(
      <AppShell
        role="organizer"
        userName="Test User"
        kycStatus="verified"
        notifications={[]}
        categories={[{ id: "cat-1", name: "DJ", subcategories: [] }]}
        cities={[{ id: "city-1", name: "Hanoi" }]}
      >
        <div />
      </AppShell>
    );
    expect(screen.getByTestId("sidebar")).toHaveTextContent("DJ|Hanoi");
  });
});
