import { describe, expect, it } from "bun:test";
import { ACCOUNT_LIST_PAGE_SIZE, getPageNumbers, parsePageParam, totalPagesFor } from "@/lib/pagination";

describe("ACCOUNT_LIST_PAGE_SIZE", () => {
  it("is 10", () => {
    expect(ACCOUNT_LIST_PAGE_SIZE).toBe(10);
  });
});

describe("totalPagesFor", () => {
  it("divides the total count by the page size, rounding up", () => {
    expect(totalPagesFor(25, 10)).toBe(3);
    expect(totalPagesFor(30, 10)).toBe(3);
    expect(totalPagesFor(1, 10)).toBe(1);
  });

  it("returns 1 for a zero (or negative) count so there's always at least one page", () => {
    expect(totalPagesFor(0, 10)).toBe(1);
  });
});

describe("parsePageParam", () => {
  it("returns 1 for undefined/missing", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("parses a valid positive integer string", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("takes the first value when given an array (repeated query param)", () => {
    expect(parsePageParam(["4", "5"])).toBe(4);
  });

  it("falls back to 1 for non-numeric, zero, or negative values", () => {
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
  });

  it("floors a fractional value", () => {
    expect(parsePageParam("2.9")).toBe(2);
  });
});

describe("getPageNumbers", () => {
  it("returns every page when the total is small", () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("windows around the current page with ellipses when there are many pages", () => {
    expect(getPageNumbers(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  });

  it("has no leading ellipsis when the current page is near the start", () => {
    expect(getPageNumbers(2, 20)).toEqual([1, 2, 3, "ellipsis", 20]);
  });

  it("has no trailing ellipsis when the current page is near the end", () => {
    expect(getPageNumbers(19, 20)).toEqual([1, "ellipsis", 18, 19, 20]);
  });
});
