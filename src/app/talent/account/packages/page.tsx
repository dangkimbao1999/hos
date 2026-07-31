import { AccountShell } from "@/components/account/account-shell";
import { PackagesContent } from "@/components/account/packages-content";

export default function TalentPackagesPage() {
  return (
    <AccountShell role="talent">
      <PackagesContent role="talent" />
    </AccountShell>
  );
}

