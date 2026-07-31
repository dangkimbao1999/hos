import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";
import { listBookingsForOrganizer } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerOrdersPage() {
  const profile = await getCurrentProfile();
  const bookings = profile ? await listBookingsForOrganizer(profile.id) : [];

  return (
    <AccountShell role="organizer">
      <OrdersContent role="organizer" bookings={bookings} />
    </AccountShell>
  );
}
