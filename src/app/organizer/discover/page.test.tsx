import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption } from "@/lib/supabase/types";

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => [{ id: "cat-1", name: "DJ", subcategories: [] }] as CategoryOption[],
  listCities: async () => [{ id: "city-1", name: "Hanoi" }] as LookupOption[],
}));
mock.module("@/lib/supabase/packages", () => ({
  listDiscoverPackages: async () => [],
}));
mock.module("@/components/shell/discover-content", () => ({
  DiscoverContent: (props: { categories: CategoryOption[]; cities: LookupOption[] }) => (
    <div data-testid="content">
      {props.categories.map((c) => c.name).join(",")}|{props.cities.map((c) => c.name).join(",")}
    </div>
  ),
}));

import OrganizerDiscoverPage from "@/app/organizer/discover/page";

describe("OrganizerDiscoverPage", () => {
  it("fetches categories/cities and passes them to DiscoverContent", async () => {
    const jsx = await OrganizerDiscoverPage();
    render(jsx);
    expect(screen.getByTestId("content")).toHaveTextContent("DJ|Hanoi");
  });
});
