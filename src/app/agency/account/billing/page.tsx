import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { BillingContent } from "@/components/account/billing-content";

export default function AgencyBillingPage() {
  return (
    <AppShell role="agency">
      <AccountShell role="agency">
        <BillingContent />
      </AccountShell>
    </AppShell>
  );
}
