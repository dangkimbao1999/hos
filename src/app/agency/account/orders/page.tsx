import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";

export default function AgencyOrdersPage() {
  return (
    <AccountShell role="agency">
      <OrdersContent role="agency" />
    </AccountShell>
  );
}

