import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";
import { listBookingsForTalent } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentOrdersPage() {
  const profile = await getCurrentProfile();
  const bookings = profile ? await listBookingsForTalent(profile.id) : [];

  return (
    <AccountShell role="talent">
      <OrdersContent role="talent" bookings={bookings} />
    </AccountShell>
  );
}
