import { Suspense } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";
import { ACCOUNT_LIST_PAGE_SIZE, totalPagesFor } from "@/lib/pagination";
import { resolveOrdersPageParams, searchBookingsForRole } from "@/lib/supabase/packages";
import { listReviewedSourceIds } from "@/lib/supabase/reviews";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [profile, params] = await Promise.all([getCurrentProfile(), searchParams]);
  const { status, search, page } = resolveOrdersPageParams(params);

  const [{ bookings, totalCount }, reviewed] = profile
    ? await Promise.all([
        searchBookingsForRole("organizer", profile.id, { status, search }, page),
        listReviewedSourceIds(profile.id),
      ])
    : [
        { bookings: [], totalCount: 0 },
        { bookingIds: new Set<string>(), applicationIds: new Set<string>() },
      ];

  return (
    <AccountShell role="organizer">
      <Suspense>
        <OrdersContent
          role="organizer"
          bookings={bookings}
          reviewedBookingIds={reviewed.bookingIds}
          currentPage={page}
          totalPages={totalPagesFor(totalCount, ACCOUNT_LIST_PAGE_SIZE)}
        />
      </Suspense>
    </AccountShell>
  );
}
