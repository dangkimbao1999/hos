import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption } from "@/lib/supabase/types";

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => [{ id: "cat-1", name: "DJ", subcategories: [] }] as CategoryOption[],
  listCities: async () => [{ id: "city-1", name: "Hanoi" }] as LookupOption[],
}));
mock.module("@/lib/supabase/packages", () => ({
  listPackagesWithBookingCounts: async () => [],
}));
mock.module("@/lib/supabase/server", () => ({
  getCurrentProfile: async () => ({ id: "talent-1" }),
}));
mock.module("@/components/account/account-shell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
mock.module("@/components/account/packages-content", () => ({
  PackagesContent: (props: { categories: CategoryOption[]; cities: LookupOption[] }) => (
    <div data-testid="content">
      {props.categories.map((c) => c.name).join(",")}|{props.cities.map((c) => c.name).join(",")}
    </div>
  ),
}));

import TalentPackagesPage from "@/app/talent/account/packages/page";

describe("TalentPackagesPage", () => {
  it("fetches categories/cities and passes them to PackagesContent", async () => {
    const jsx = await TalentPackagesPage();
    render(jsx);
    expect(screen.getByTestId("content")).toHaveTextContent("DJ|Hanoi");
  });
});
