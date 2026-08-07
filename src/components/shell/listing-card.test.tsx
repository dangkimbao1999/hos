import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { formatPriceRange, ListingCard, ListingRow, SearchResultCard } from "@/components/shell/listing-card";

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

  test("renders the real avatar image when avatarUrl is set", () => {
    render(<ListingRow data={{ ...sampleData, avatarUrl: "https://example.com/avatar.jpg" }} />);
    expect((screen.getByAltText("") as HTMLImageElement).src).toBe("https://example.com/avatar.jpg");
  });

  test("falls back to the placeholder icon when avatarUrl is absent", () => {
    render(<ListingRow data={sampleData} />);
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });
});

describe("ListingCard", () => {
  test("renders the real avatar image when avatarUrl is set", () => {
    render(<ListingCard data={{ ...sampleData, avatarUrl: "https://example.com/avatar.jpg" }} />);
    expect((screen.getByAltText("") as HTMLImageElement).src).toBe("https://example.com/avatar.jpg");
  });

  test("falls back to the placeholder icon when avatarUrl is absent", () => {
    render(<ListingCard data={sampleData} />);
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });
});

describe("SearchResultCard", () => {
  test("renders the real avatar image when avatarUrl is set", () => {
    render(<SearchResultCard data={{ ...sampleData, avatarUrl: "https://example.com/avatar.jpg" }} />);
    expect((screen.getByAltText("") as HTMLImageElement).src).toBe("https://example.com/avatar.jpg");
  });

  test("falls back to the placeholder icon when avatarUrl is absent", () => {
    render(<SearchResultCard data={sampleData} />);
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });
});
