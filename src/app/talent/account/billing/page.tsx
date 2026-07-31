import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { BillingContent } from "@/components/account/billing-content";

export default function TalentBillingPage() {
  return (
    <AppShell role="talent">
      <AccountShell role="talent">
        <BillingContent />
      </AccountShell>
    </AppShell>
  );
}
