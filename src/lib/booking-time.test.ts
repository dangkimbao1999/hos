import { describe, expect, it } from "bun:test";
import { hasEndTimePassed } from "@/lib/booking-time";

describe("hasEndTimePassed", () => {
  it("returns false when now is before the booking's end time", () => {
    const now = new Date("2026-12-01T20:30:00");
    expect(hasEndTimePassed("2026-12-01", "21:00:00", now)).toBe(false);
  });

  it("returns true when now is after the booking's end time", () => {
    const now = new Date("2026-12-01T21:30:00");
    expect(hasEndTimePassed("2026-12-01", "21:00:00", now)).toBe(true);
  });

  it("returns true exactly at the end time", () => {
    const now = new Date("2026-12-01T21:00:00");
    expect(hasEndTimePassed("2026-12-01", "21:00:00", now)).toBe(true);
  });

  it("accepts HH:MM (no seconds)", () => {
    const now = new Date("2026-12-01T21:30:00");
    expect(hasEndTimePassed("2026-12-01", "21:00", now)).toBe(true);
  });

  it("returns false when the date or end time is missing", () => {
    const now = new Date("2026-12-01T21:30:00");
    expect(hasEndTimePassed(null, "21:00:00", now)).toBe(false);
    expect(hasEndTimePassed("2026-12-01", null, now)).toBe(false);
    expect(hasEndTimePassed(null, null, now)).toBe(false);
  });

  it("defaults now to the current time when not provided", () => {
    expect(hasEndTimePassed("2000-01-01", "00:00:00")).toBe(true);
    expect(hasEndTimePassed("2999-01-01", "00:00:00")).toBe(false);
  });
});
