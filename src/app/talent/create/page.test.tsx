import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption } from "@/lib/supabase/types";

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => [{ id: "cat-1", name: "DJ", subcategories: [] }] as CategoryOption[],
  listCities: async () => [{ id: "city-1", name: "Hanoi" }] as LookupOption[],
}));
mock.module("@/components/shell/event-home-content", () => ({ EventHomeContent: () => null }));
mock.module("@/components/create-package/auto-open-dialog", () => ({
  AutoOpenCreatePackageDialog: (props: { categories: CategoryOption[]; cities: LookupOption[] }) => (
    <div data-testid="dialog">
      {props.categories.map((c) => c.name).join(",")}|{props.cities.map((c) => c.name).join(",")}
    </div>
  ),
}));

import TalentCreatePackagePage from "@/app/talent/create/page";

describe("TalentCreatePackagePage", () => {
  it("fetches categories/cities and passes them to AutoOpenCreatePackageDialog", async () => {
    const jsx = await TalentCreatePackagePage();
    render(jsx);
    expect(screen.getByTestId("dialog")).toHaveTextContent("DJ|Hanoi");
  });
});
