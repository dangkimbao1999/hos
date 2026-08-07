import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { OrderDetailContent } from "@/components/account/order-detail-content";
import { getBookingDetail } from "@/lib/supabase/packages";

export default async function TalentOrderDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = await getBookingDetail(bookingId);
  if (!booking) notFound();

  return (
    <AccountShell role="talent">
      <OrderDetailContent role="talent" booking={booking} />
    </AccountShell>
  );
}
