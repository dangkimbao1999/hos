import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";
import { todayParts } from "@/lib/calendar";

export default function AgencySchedulePage() {
  // Agency is out of scope for now — no real schedule source yet.
  return (
    <AccountShell role="agency">
      <ScheduleContent initialEntries={[]} initialToday={todayParts()} />
    </AccountShell>
  );
}
