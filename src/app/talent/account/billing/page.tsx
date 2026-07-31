import { AccountShell } from "@/components/account/account-shell";
import { BillingContent } from "@/components/account/billing-content";

export default function TalentBillingPage() {
  return (
    <AccountShell role="talent">
      <BillingContent />
    </AccountShell>
  );
}

