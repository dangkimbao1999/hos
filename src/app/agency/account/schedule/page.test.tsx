import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

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

import AgencySchedulePage from "@/app/agency/account/schedule/page";

describe("AgencySchedulePage", () => {
  it("renders with an empty placeholder schedule (no real data source yet)", () => {
    render(AgencySchedulePage());
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(scheduleContentProps).toMatchObject({ initialEntries: [] });
    expect(scheduleContentProps!.initialToday).toBeDefined();
  });
});
