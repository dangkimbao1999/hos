import { AccountShell } from "@/components/account/account-shell";
import { BillingContent } from "@/components/account/billing-content";

export default function AgencyBillingPage() {
  return (
    <AccountShell role="agency">
      <BillingContent role="agency" />
    </AccountShell>
  );
}

