import { describe, expect, test } from "bun:test";
import { formatPriceRange } from "@/components/shell/listing-card";

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
