import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption } from "@/lib/supabase/types";

mock.module("@/components/create-package/create-package-dialog", () => ({
  CreatePackageDialog: (props: { open: boolean; categories: CategoryOption[]; cities: LookupOption[] }) => (
    <div data-testid="dialog">
      {String(props.open)}|{props.categories.map((c) => c.name).join(",")}|
      {props.cities.map((c) => c.name).join(",")}
    </div>
  ),
}));

import { AutoOpenCreatePackageDialog } from "@/components/create-package/auto-open-dialog";

afterEach(() => cleanup());

describe("AutoOpenCreatePackageDialog", () => {
  it("opens the dialog by default and forwards categories/cities", () => {
    render(
      <AutoOpenCreatePackageDialog
        role="talent"
        categories={[{ id: "cat-1", name: "DJ", subcategories: [] }]}
        cities={[{ id: "city-1", name: "Hanoi" }]}
      />
    );
    expect(screen.getByTestId("dialog")).toHaveTextContent("true|DJ|Hanoi");
  });
});
