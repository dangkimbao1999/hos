import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { PackagesContent } from "@/components/account/packages-content";

export default function AgencyPackagesPage() {
  return (
    <AppShell role="agency">
      <AccountShell role="agency">
        <PackagesContent role="agency" />
      </AccountShell>
    </AppShell>
  );
}
