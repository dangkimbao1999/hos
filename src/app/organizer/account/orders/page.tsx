import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";

export default function OrganizerOrdersPage() {
  return (
    <AccountShell role="organizer">
      <OrdersContent />
    </AccountShell>
  );
}

