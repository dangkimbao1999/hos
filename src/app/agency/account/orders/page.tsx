import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";

export default function AgencyOrdersPage() {
  return (
    <AppShell role="agency">
      <AccountShell role="agency">
        <OrdersContent />
      </AccountShell>
    </AppShell>
  );
}
