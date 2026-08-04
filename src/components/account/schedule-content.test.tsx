import { describe, expect, test } from "bun:test";
import { formatHour } from "@/components/account/schedule-content";

describe("formatHour", () => {
  test("formats a whole morning hour without minutes", () => {
    expect(formatHour(8)).toBe("8AM");
  });

  test("formats a whole evening hour as PM", () => {
    expect(formatHour(20)).toBe("8PM");
  });

  test("formats noon as 12PM", () => {
    expect(formatHour(12)).toBe("12PM");
  });

  test("formats midnight as 12AM", () => {
    expect(formatHour(24)).toBe("12AM");
  });

  test("formats a fractional hour with minutes", () => {
    expect(formatHour(21.5)).toBe("9:30PM");
  });
});
