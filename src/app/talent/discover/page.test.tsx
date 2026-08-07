import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption } from "@/lib/supabase/types";

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => [{ id: "cat-1", name: "DJ", subcategories: [] }] as CategoryOption[],
}));
mock.module("@/lib/supabase/events", () => ({
  listEventListings: async () => [],
}));
mock.module("@/components/shell/event-discover-content", () => ({
  EventDiscoverContent: (props: { categories: CategoryOption[] }) => (
    <div data-testid="content">{props.categories.map((c) => c.name).join(",")}</div>
  ),
}));

import TalentDiscoverPage from "@/app/talent/discover/page";

describe("TalentDiscoverPage", () => {
  it("fetches categories and passes them to EventDiscoverContent", async () => {
    const jsx = await TalentDiscoverPage();
    render(jsx);
    expect(screen.getByTestId("content")).toHaveTextContent("DJ");
  });
});
