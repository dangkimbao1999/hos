import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { CategoryOption } from "@/lib/supabase/types";

let categoriesToReturn: CategoryOption[] = [{ id: "cat-1", name: "DJ", subcategories: [] }];

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => categoriesToReturn,
}));
mock.module("@/app/organizer/create/create-event-form", () => ({
  CreateEventForm: (props: { categories: CategoryOption[] }) => (
    <div data-testid="form">{props.categories.map((c) => c.name).join(", ")}</div>
  ),
}));

import CreateEventPage from "@/app/organizer/create/page";

afterEach(() => {
  cleanup();
  categoriesToReturn = [{ id: "cat-1", name: "DJ", subcategories: [] }];
});

describe("CreateEventPage", () => {
  it("fetches categories and passes them to CreateEventForm", async () => {
    const jsx = await CreateEventPage();
    render(jsx);
    expect(screen.getByTestId("form")).toHaveTextContent("DJ");
  });
});
