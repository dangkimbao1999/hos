import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

let fetchCalls: { start: string; end: string }[] = [];
let fetchResponses: ScheduleEntry[][] = [];
mock.module("@/lib/supabase/schedule-actions", () => ({
  fetchScheduleEntries: async (start: string, end: string) => {
    fetchCalls.push({ start, end });
    return fetchResponses.shift() ?? [];
  },
}));

import { formatHour, ScheduleContent } from "@/components/account/schedule-content";
import type { ScheduleEntry } from "@/lib/supabase/schedule";

afterEach(() => {
  cleanup();
  fetchCalls = [];
  fetchResponses = [];
});

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

function makeEntry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    title: "Acoustic Set",
    venue: "HCM City",
    date: "2026-08-09",
    startHour: 18,
    endHour: 22,
    ...overrides,
  };
}

// 2026-08-09 is a Sunday.
const TODAY = { year: 2026, month: 7, day: 9 };

describe("ScheduleContent — initial render", () => {
  test("shows initialEntries without calling fetchScheduleEntries", () => {
    render(<ScheduleContent initialEntries={[makeEntry({ title: "Initial Gig" })]} initialToday={TODAY} />);
    // Renders both in the week grid (today falls in the displayed week) and the Upcoming sidebar.
    expect(screen.getAllByText("Initial Gig").length).toBeGreaterThan(0);
    expect(fetchCalls).toEqual([]);
  });

  test("the Upcoming Events sidebar shows today-or-later entries, excluding past ones", () => {
    render(
      <ScheduleContent
        initialEntries={[
          makeEntry({ title: "Past Gig", date: "2026-08-01" }),
          makeEntry({ title: "Future Gig", date: "2026-08-20" }),
        ]}
        initialToday={TODAY}
      />
    );
    expect(screen.getByText("Future Gig")).toBeInTheDocument();
    expect(screen.queryByText("Past Gig")).not.toBeInTheDocument();
  });
});

describe("ScheduleContent — month navigation refetches the padded window", () => {
  test("clicking Next month fetches next month's padded window and replaces entries", async () => {
    fetchResponses = [[makeEntry({ title: "September Gig", date: "2026-09-10" })]];
    render(<ScheduleContent initialEntries={[]} initialToday={TODAY} />);

    fireEvent.click(screen.getByRole("button", { name: /next month/i }));

    await waitFor(() => {
      expect(screen.getByText("September Gig")).toBeInTheDocument();
    });
    expect(fetchCalls).toEqual([{ start: "2026-08-26", end: "2026-10-06" }]);
  });

  test("clicking Previous month fetches the prior month's padded window", async () => {
    fetchResponses = [[]];
    render(<ScheduleContent initialEntries={[]} initialToday={TODAY} />);

    fireEvent.click(screen.getByRole("button", { name: /previous month/i }));

    await waitFor(() => {
      expect(fetchCalls).toEqual([{ start: "2026-06-25", end: "2026-08-06" }]);
    });
  });
});
