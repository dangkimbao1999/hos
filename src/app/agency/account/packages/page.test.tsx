import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption } from "@/lib/supabase/types";

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => [{ id: "cat-1", name: "DJ", subcategories: [] }] as CategoryOption[],
  listCities: async () => [{ id: "city-1", name: "Hanoi" }] as LookupOption[],
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

import AgencyPackagesPage from "@/app/agency/account/packages/page";

describe("AgencyPackagesPage", () => {
  it("fetches categories/cities and passes them to PackagesContent", async () => {
    const jsx = await AgencyPackagesPage();
    render(jsx);
    expect(screen.getByTestId("content")).toHaveTextContent("DJ|Hanoi");
  });
});
