import { AppShell } from "@/components/shell/app-shell";
import { CheckoutContent } from "@/components/checkout/checkout-content";

export default function CheckoutPage() {
  return (
    <AppShell role="organizer">
      <CheckoutContent />
    </AppShell>
  );
}
