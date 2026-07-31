import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";

export default function OrganizerOrdersPage() {
  return (
    <AppShell role="organizer">
      <AccountShell role="organizer">
        <OrdersContent />
      </AccountShell>
    </AppShell>
  );
}
