import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";

export default function TalentOrdersPage() {
  return (
    <AppShell role="talent">
      <AccountShell role="talent">
        <OrdersContent />
      </AccountShell>
    </AppShell>
  );
}
