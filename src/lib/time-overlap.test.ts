import { describe, expect, test } from "bun:test";
import { timeRangesOverlap } from "@/lib/time-overlap";

describe("timeRangesOverlap", () => {
  test("overlapping ranges", () => {
    expect(timeRangesOverlap("14:00", "15:00", "14:30", "15:30")).toBe(true);
  });

  test("one range fully inside the other", () => {
    expect(timeRangesOverlap("09:00", "18:00", "14:00", "15:00")).toBe(true);
  });

  test("identical ranges", () => {
    expect(timeRangesOverlap("14:00", "15:00", "14:00", "15:00")).toBe(true);
  });

  test("adjacent ranges (end of one equals start of the other) do not overlap", () => {
    expect(timeRangesOverlap("14:00", "15:00", "15:00", "16:00")).toBe(false);
  });

  test("completely separate ranges do not overlap", () => {
    expect(timeRangesOverlap("09:00", "10:00", "14:00", "15:00")).toBe(false);
  });

  test("works regardless of which range is passed first", () => {
    expect(timeRangesOverlap("14:30", "15:30", "14:00", "15:00")).toBe(true);
  });
});
