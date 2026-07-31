import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";

export default function OrganizerSchedulePage() {
  return (
    <AccountShell role="organizer">
      <ScheduleContent />
    </AccountShell>
  );
}

