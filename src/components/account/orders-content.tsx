"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockOrders } from "@/lib/mock-account";
import { acceptBooking, rejectBooking } from "@/lib/supabase/package-actions";
import { ReviewDialog } from "@/components/shared/review-dialog";
import type { BookingWithNames } from "@/lib/supabase/types";
import type { Role } from "@/lib/nav-items";
import { runAction } from "@/lib/toast-action";

const todayIso = () => new Date().toISOString().slice(0, 10);

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-500",
  Confirmed: "bg-blue-500/10 text-blue-400",
  Completed: "bg-green-500/10 text-green-500",
  Cancelled: "bg-white/10 text-muted-foreground",
};

const SUB_FILTERS = ["All", "Upcoming", "Pending", "Pending done", "Wait to confirm", "Done", "Canceled"];

function formatVnd(n: number) {
  return `${n.toLocaleString("en-US")} VND`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface DisplayOrder {
  id: string;
  fullId?: string;
  counterpartName: string;
  packageName: string;
  date: string;
  price: string;
  status: string;
  rawStatus?: string;
  bookedDate?: string | null;
}

export function OrdersContent({
  role,
  bookings,
  reviewedBookingIds,
}: {
  role: Role;
  bookings?: BookingWithNames[];
  reviewedBookingIds?: Set<string>;
}) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(SUB_FILTERS[0]);
  const [pendingId, setPendingId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [reviewTarget, setReviewTarget] = useState<{ id: string; talentName: string } | null>(null);
  const counterpartLabel = role === "organizer" ? "Talent" : "Organizer";
  const isTalent = role === "talent";
  const isOrganizer = role === "organizer";

  const orders: DisplayOrder[] = bookings
    ? bookings.map((b) => ({
        id: b.id.slice(0, 8).toUpperCase(),
        fullId: b.id,
        counterpartName: role === "organizer" ? b.talent_name : b.organizer_name,
        packageName: b.package_title,
        date: b.booked_date ?? "Flexible",
        price: formatVnd(b.price_vnd),
        status: capitalize(b.status),
        rawStatus: b.status,
        bookedDate: b.booked_date,
      }))
    : mockOrders.map((o) => ({
        id: o.id,
        counterpartName: o.talentName,
        packageName: o.packageName,
        date: o.date,
        price: o.priceVnd,
        status: o.status,
      }));

  async function handle(action: "accept" | "reject", id: string) {
    setError(undefined);
    setPendingId(id);
    const result = await runAction(action === "accept" ? acceptBooking(id) : rejectBooking(id), {
      success: action === "accept" ? "Booking accepted." : "Booking rejected.",
    });
    setPendingId(undefined);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {SUB_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeFilter === filter
                  ? "bg-foreground text-background"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-input px-4 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by events name..."
            className="w-56 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col overflow-hidden rounded-md bg-white/5">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span>Order</span>
          <span>{counterpartLabel}</span>
          <span>Date</span>
          <span>Price</span>
          <span>Status</span>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0"
            >
              <span className="text-muted-foreground">{order.id}</span>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{order.counterpartName}</span>
                <span className="text-xs text-muted-foreground">{order.packageName}</span>
              </div>
              <span className="text-foreground">{order.date}</span>
              <span className="font-semibold text-foreground">{order.price}</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn("w-fit rounded-full px-3 py-1 text-xs font-medium", statusStyles[order.status])}
                >
                  {order.status}
                </span>
                {isTalent && order.status === "Pending" && order.fullId && (
                  <>
                    <button
                      type="button"
                      disabled={pendingId === order.fullId}
                      onClick={() => handle("reject", order.fullId!)}
                      className="rounded-[6px] bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/10"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === order.fullId}
                      onClick={() => handle("accept", order.fullId!)}
                      className="rounded-[6px] bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Accept
                    </button>
                  </>
                )}
                {isOrganizer &&
                  order.fullId &&
                  order.rawStatus === "confirmed" &&
                  order.bookedDate &&
                  order.bookedDate < todayIso() &&
                  !reviewedBookingIds?.has(order.fullId) && (
                    <button
                      type="button"
                      onClick={() => setReviewTarget({ id: order.fullId!, talentName: order.counterpartName })}
                      className="rounded-[6px] bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/10"
                    >
                      Leave a Review
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      {reviewTarget && (
        <ReviewDialog
          open={reviewTarget !== null}
          onOpenChange={(open) => {
            if (!open) setReviewTarget(null);
          }}
          sourceType="booking"
          sourceId={reviewTarget.id}
          talentName={reviewTarget.talentName}
          onSubmitted={() => router.refresh()}
        />
      )}
    </div>
  );
}
