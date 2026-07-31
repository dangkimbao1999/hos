import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";

export default function AgencySchedulePage() {
  return (
    <AppShell role="agency">
      <AccountShell role="agency">
        <ScheduleContent />
      </AccountShell>
    </AppShell>
  );
}
