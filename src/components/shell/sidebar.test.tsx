import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("next/navigation", () => ({ usePathname: () => "/organizer" }));
mock.module("@/components/create-package/create-package-dialog", () => ({
  CreatePackageDialog: () => null,
}));

import { Sidebar } from "@/components/shell/sidebar";

afterEach(() => cleanup());

const CATEGORIES = [
  { id: "cat-solo", name: "Solo Singer", subcategories: [{ id: "cat-rapper", name: "Rapper" }] },
  { id: "cat-dj", name: "DJ", subcategories: [] },
];

describe("Sidebar", () => {
  it("renders category names from the categories prop", () => {
    render(<Sidebar role="organizer" kycStatus="verified" categories={CATEGORIES} cities={[]} />);
    expect(screen.getByText("Solo Singer")).toBeInTheDocument();
    expect(screen.getByText("DJ")).toBeInTheDocument();
  });

  it("expands a category to show its subcategories, linking by category id", () => {
    render(<Sidebar role="organizer" kycStatus="verified" categories={CATEGORIES} cities={[]} />);
    fireEvent.click(screen.getByText("Solo Singer"));
    const link = screen.getByRole("link", { name: "Rapper" });
    expect(link).toHaveAttribute("href", "/organizer/discover?category=cat-solo");
  });
});
