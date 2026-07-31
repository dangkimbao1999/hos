import { AccountShell } from "@/components/account/account-shell";
import { BillingContent } from "@/components/account/billing-content";

export default function OrganizerBillingPage() {
  return (
    <AccountShell role="organizer">
      <BillingContent />
    </AccountShell>
  );
}

