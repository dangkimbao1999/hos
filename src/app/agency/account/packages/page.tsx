import { AccountShell } from "@/components/account/account-shell";
import { PackagesContent } from "@/components/account/packages-content";

export default function AgencyPackagesPage() {
  return (
    <AccountShell role="agency">
      <PackagesContent role="agency" />
    </AccountShell>
  );
}

