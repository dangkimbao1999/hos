import { describe, expect, it } from "bun:test";
import { buildIcsContent } from "@/lib/ics";

describe("buildIcsContent", () => {
  it("builds a VCALENDAR/VEVENT block with compact local date-times", () => {
    const ics = buildIcsContent({
      uid: "booking-1",
      title: "Acoustic Set",
      date: "2026-12-01",
      startTime: "20:00",
      endTime: "21:00",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261201T200000");
    expect(ics).toContain("DTEND:20261201T210000");
    expect(ics).toContain("UID:booking-1");
    expect(ics).toContain("SUMMARY:Acoustic Set");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("accepts HH:MM:SS times", () => {
    const ics = buildIcsContent({
      uid: "booking-1",
      title: "Set",
      date: "2026-12-01",
      startTime: "20:00:00",
      endTime: "21:30:00",
    });
    expect(ics).toContain("DTSTART:20261201T200000");
    expect(ics).toContain("DTEND:20261201T213000");
  });

  it("includes LOCATION when provided and omits it otherwise", () => {
    const withLocation = buildIcsContent({
      uid: "booking-1",
      title: "Set",
      date: "2026-12-01",
      startTime: "20:00",
      endTime: "21:00",
      location: "123 Main St, HCM City",
    });
    expect(withLocation).toContain("LOCATION:123 Main St\\, HCM City");

    const withoutLocation = buildIcsContent({
      uid: "booking-1",
      title: "Set",
      date: "2026-12-01",
      startTime: "20:00",
      endTime: "21:00",
    });
    expect(withoutLocation).not.toContain("LOCATION:");
  });

  it("includes DESCRIPTION when provided and omits it otherwise", () => {
    const withDescription = buildIcsContent({
      uid: "booking-1",
      title: "Set",
      date: "2026-12-01",
      startTime: "20:00",
      endTime: "21:00",
      description: "Bring your own mic",
    });
    expect(withDescription).toContain("DESCRIPTION:Bring your own mic");

    const withoutDescription = buildIcsContent({
      uid: "booking-1",
      title: "Set",
      date: "2026-12-01",
      startTime: "20:00",
      endTime: "21:00",
    });
    expect(withoutDescription).not.toContain("DESCRIPTION:");
  });

  it("escapes commas, semicolons, and newlines in free-text fields", () => {
    const ics = buildIcsContent({
      uid: "booking-1",
      title: "Set; Part 1, encore",
      date: "2026-12-01",
      startTime: "20:00",
      endTime: "21:00",
      description: "Line one\nLine two",
    });
    expect(ics).toContain("SUMMARY:Set\\; Part 1\\, encore");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
  });
});
