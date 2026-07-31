import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";

export default function TalentSchedulePage() {
  return (
    <AppShell role="talent">
      <AccountShell role="talent">
        <ScheduleContent />
      </AccountShell>
    </AppShell>
  );
}
