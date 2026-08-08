import { Suspense } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersContent } from "@/components/account/orders-content";
import { ACCOUNT_LIST_PAGE_SIZE, totalPagesFor } from "@/lib/pagination";
import { resolveOrdersPageParams, searchBookingsForRole } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [profile, params] = await Promise.all([getCurrentProfile(), searchParams]);
  const { status, search, page } = resolveOrdersPageParams(params);

  const { bookings, totalCount } = profile
    ? await searchBookingsForRole("talent", profile.id, { status, search }, page)
    : { bookings: [], totalCount: 0 };

  return (
    <AccountShell role="talent">
      <Suspense>
        <OrdersContent
          role="talent"
          bookings={bookings}
          currentPage={page}
          totalPages={totalPagesFor(totalCount, ACCOUNT_LIST_PAGE_SIZE)}
        />
      </Suspense>
    </AccountShell>
  );
}
