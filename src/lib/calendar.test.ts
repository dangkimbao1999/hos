import { describe, expect, test } from "bun:test";
import { addMonths, getMonthGrid, monthFetchWindow, startOfWeekMonday, toIsoDate } from "@/lib/calendar";

describe("toIsoDate", () => {
  test("zero-pads single-digit month and day", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("formats double-digit month and day without padding", () => {
    expect(toIsoDate(new Date(2026, 10, 23))).toBe("2026-11-23");
  });
});

describe("startOfWeekMonday", () => {
  test("returns the same date when given a Monday", () => {
    // 2026-08-03 is a Monday
    expect(toIsoDate(startOfWeekMonday(new Date(2026, 7, 3)))).toBe("2026-08-03");
  });

  test("returns the preceding Monday when given a Wednesday", () => {
    // 2026-08-05 is a Wednesday
    expect(toIsoDate(startOfWeekMonday(new Date(2026, 7, 5)))).toBe("2026-08-03");
  });

  test("returns the preceding Monday when given a Sunday", () => {
    // 2026-08-09 is a Sunday; JS Date.getDay() treats Sunday as 0, which must
    // not be mistaken for "start of week" in a Monday-first calendar.
    expect(toIsoDate(startOfWeekMonday(new Date(2026, 7, 9)))).toBe("2026-08-03");
  });
});

describe("addMonths", () => {
  test("advances within the same year", () => {
    expect(addMonths(2026, 5, 1)).toEqual({ year: 2026, month: 6 });
  });

  test("rolls forward over a year boundary", () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  test("rolls backward over a year boundary", () => {
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe("getMonthGrid", () => {
  test("computes leading blanks for a month starting on Monday", () => {
    // August 2026 starts on a Saturday... use a month known to start Monday instead.
    // 2026-06-01 is a Monday.
    expect(getMonthGrid(2026, 5).leadingBlanks).toBe(0);
  });

  test("computes leading blanks for a month starting on Sunday", () => {
    // 2026-11-01 is a Sunday -> 6 blanks before it in a Monday-first grid.
    expect(getMonthGrid(2026, 10).leadingBlanks).toBe(6);
  });

  test("returns the correct number of days for a 28-day February", () => {
    expect(getMonthGrid(2026, 1).days).toHaveLength(28);
  });

  test("returns the correct number of days for a leap-year February", () => {
    expect(getMonthGrid(2028, 1).days).toHaveLength(29);
  });

  test("days array starts at 1 and ends at the last day of the month", () => {
    const grid = getMonthGrid(2026, 7);
    expect(grid.days[0]).toBe(1);
    expect(grid.days[grid.days.length - 1]).toBe(31);
  });
});

describe("monthFetchWindow", () => {
  test("pads 6 days before the 1st and 6 days after the last day of the month", () => {
    // August 2026: 1st is a Saturday, 31st is a Monday.
    expect(monthFetchWindow(2026, 7)).toEqual({ start: "2026-07-26", end: "2026-09-06" });
  });

  test("the padded start covers the Monday of the week containing the 1st, for any weekday the 1st falls on", () => {
    for (let month = 0; month < 12; month++) {
      const { start } = monthFetchWindow(2026, month);
      const firstOfMonth = new Date(2026, month, 1);
      const mondayOfFirstWeek = startOfWeekMonday(firstOfMonth);
      expect(new Date(start).getTime()).toBeLessThanOrEqual(mondayOfFirstWeek.getTime());
    }
  });

  test("the padded end covers the Sunday of the week containing the last day, for any weekday it falls on", () => {
    for (let month = 0; month < 12; month++) {
      const { end } = monthFetchWindow(2026, month);
      const lastOfMonth = new Date(2026, month + 1, 0);
      const mondayOfLastWeek = startOfWeekMonday(lastOfMonth);
      const sundayOfLastWeek = new Date(mondayOfLastWeek);
      sundayOfLastWeek.setDate(sundayOfLastWeek.getDate() + 6);
      expect(new Date(end).getTime()).toBeGreaterThanOrEqual(sundayOfLastWeek.getTime());
    }
  });

  test("rolls correctly across a year boundary", () => {
    expect(monthFetchWindow(2026, 11)).toEqual({ start: "2026-11-25", end: "2027-01-06" });
  });
});
