import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";

export default function TalentOrdersPage() {
  return (
    <AccountShell role="talent">
      <OrdersContent />
    </AccountShell>
  );
}

