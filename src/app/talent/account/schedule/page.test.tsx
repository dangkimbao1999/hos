import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { monthFetchWindow } from "@/lib/calendar";
import type { ScheduleEntry } from "@/lib/supabase/schedule";

mock.module("@/lib/supabase/server", () => ({
  getCurrentProfile: async () => ({ id: "talent-1" }),
}));

let listArgs: { profileId: string; role: string; start: string; end: string } | null = null;
let listResult: ScheduleEntry[] = [];
mock.module("@/lib/supabase/schedule", () => ({
  listScheduleEntries: async (profileId: string, role: string, start: string, end: string) => {
    listArgs = { profileId, role, start, end };
    return listResult;
  },
}));
mock.module("@/components/account/account-shell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

let scheduleContentProps: Record<string, unknown> | null = null;
mock.module("@/components/account/schedule-content", () => ({
  ScheduleContent: (props: Record<string, unknown>) => {
    scheduleContentProps = props;
    return <div data-testid="content" />;
  },
}));

import TalentSchedulePage from "@/app/talent/account/schedule/page";

describe("TalentSchedulePage", () => {
  it("fetches the current month's padded window for the talent, passing entries + today through", async () => {
    listResult = [{ title: "Set", venue: "Venue", date: "2026-08-09", startHour: 18, endHour: 22 }];
    const jsx = await TalentSchedulePage();
    render(jsx);

    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(scheduleContentProps).toMatchObject({ initialEntries: listResult });

    const today = scheduleContentProps!.initialToday as { year: number; month: number; day: number };
    const expectedWindow = monthFetchWindow(today.year, today.month);
    expect(listArgs).toEqual({
      profileId: "talent-1",
      role: "talent",
      start: expectedWindow.start,
      end: expectedWindow.end,
    });
  });
});
