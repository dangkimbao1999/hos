import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { PackagesContent } from "@/components/account/packages-content";

export default function TalentPackagesPage() {
  return (
    <AppShell role="talent">
      <AccountShell role="talent">
        <PackagesContent role="talent" />
      </AccountShell>
    </AppShell>
  );
}
