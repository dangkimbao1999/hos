import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { formatPriceRange, ListingRow } from "@/components/shell/listing-card";

describe("formatPriceRange", () => {
  test("formats VND with no dollar sign", () => {
    expect(formatPriceRange(1_000_000, 5_000_000, "VND")).toBe("1,000,000 - 5,000,000 VND");
  });

  test("formats USD with a dollar sign", () => {
    expect(formatPriceRange(1500, 5200, "USD")).toBe("$ 1,500 - 5,200");
  });

  test("defaults to USD when currency is omitted", () => {
    expect(formatPriceRange(100, 200)).toBe("$ 100 - 200");
  });
});

const sampleData = {
  id: "pkg-1",
  title: "A$AP Rocky",
  category: "Solo Singer",
  priceMin: 5_000_000,
  priceMax: 10_000_000,
  currency: "VND" as const,
};

describe("ListingRow", () => {
  test("renders as a link when href is provided", () => {
    render(<ListingRow data={sampleData} href="/organizer/talents/asap-rocky" />);
    const link = screen.getByRole("link", { name: /A\$AP Rocky/ });
    expect(link).toHaveAttribute("href", "/organizer/talents/asap-rocky");
  });

  test("renders as a plain div (no link) when href is omitted", () => {
    render(<ListingRow data={sampleData} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("A$AP Rocky")).toBeInTheDocument();
  });
});
