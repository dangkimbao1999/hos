import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { BillingContent } from "@/components/account/billing-content";

export default function OrganizerBillingPage() {
  return (
    <AppShell role="organizer">
      <AccountShell role="organizer">
        <BillingContent />
      </AccountShell>
    </AppShell>
  );
}
