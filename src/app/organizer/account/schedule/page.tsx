import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";

export default function OrganizerSchedulePage() {
  return (
    <AppShell role="organizer">
      <AccountShell role="organizer">
        <ScheduleContent />
      </AccountShell>
    </AppShell>
  );
}
