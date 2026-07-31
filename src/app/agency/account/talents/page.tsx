import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { TalentsContent } from "@/components/account/talents-content";

export default function AgencyTalentsPage() {
  return (
    <AppShell role="agency">
      <AccountShell role="agency">
        <TalentsContent />
      </AccountShell>
    </AppShell>
  );
}
