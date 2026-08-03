import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";
import { listBookingsForOrganizer } from "@/lib/supabase/packages";
import { listReviewedSourceIds } from "@/lib/supabase/reviews";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerOrdersPage() {
  const profile = await getCurrentProfile();
  const [bookings, reviewed] = profile
    ? await Promise.all([listBookingsForOrganizer(profile.id), listReviewedSourceIds(profile.id)])
    : [[], { bookingIds: new Set<string>(), applicationIds: new Set<string>() }];

  return (
    <AccountShell role="organizer">
      <OrdersContent role="organizer" bookings={bookings} reviewedBookingIds={reviewed.bookingIds} />
    </AccountShell>
  );
}
