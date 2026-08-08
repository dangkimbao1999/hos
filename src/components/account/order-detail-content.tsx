"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmBookingOffer, rejectBooking, submitCounterOffer } from "@/lib/supabase/package-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { runAction } from "@/lib/toast-action";
import type { BookingDetail, BookingParty } from "@/lib/supabase/types";
import type { Role } from "@/lib/nav-items";

function formatVnd(n: number) {
  return `${n.toLocaleString("en-US")} VND`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const NEGOTIATION_STATUSES = new Set(["pending", "dealing"]);

export function OrderDetailContent({ role, booking }: { role: Role; booking: BookingDetail }) {
  const router = useRouter();
  const myRole: BookingParty = role === "organizer" ? "organizer" : "talent";
  const otherRole: BookingParty = myRole === "organizer" ? "talent" : "organizer";
  const [pending, setPending] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);

  const isMyTurn = booking.awaiting_response_from === myRole;
  const isNegotiating = NEGOTIATION_STATUSES.has(booking.status);
  const agreedOffer = myRole === "organizer" ? booking.talent_offer_vnd : booking.organizer_offer_vnd;

  async function handleConfirm() {
    setPending(true);
    const result = await runAction(confirmBookingOffer(booking.id), { success: "Order confirmed." });
    setPending(false);
    if (!("error" in result)) router.refresh();
  }

  async function handleCancel() {
    setPending(true);
    const result = await runAction(rejectBooking(booking.id), { success: "Booking cancelled." });
    setPending(false);
    if (!("error" in result)) router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5 rounded-md bg-white/5 p-6">
        <h2 className="text-lg font-bold text-foreground">Booking Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Organizer</span>
            <span className="text-sm font-medium text-foreground">{booking.organizer_name}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Talent</span>
            <span className="text-sm font-medium text-foreground">{booking.talent_name}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Booking Status
            </span>
            <span className="text-sm font-medium text-foreground">{capitalize(booking.status)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Booking ID</span>
            <span className="text-sm font-medium text-foreground">#{booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Payment Method
            </span>
            <span className="text-sm font-medium text-foreground">{booking.payment_method}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-[8px] bg-white/5 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Talent Offer</span>
            <span className="font-medium text-foreground">{formatVnd(booking.talent_offer_vnd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Organizer Offer</span>
            <span className="font-medium text-foreground">{formatVnd(booking.organizer_offer_vnd)}</span>
          </div>
          {!isNegotiating && (
            <div className="mt-1 flex justify-between border-t border-border pt-2">
              <span className="font-semibold text-foreground">Agreed Price</span>
              <span className="font-semibold text-foreground">{formatVnd(booking.price_vnd)}</span>
            </div>
          )}
        </div>

        {isNegotiating && (
          <div className="flex flex-col gap-2">
            <Button className="h-11 w-full rounded-[6px]" disabled={!isMyTurn || pending} onClick={handleConfirm}>
              Order Confirm
            </Button>
            <Button
              variant="secondary"
              className="h-11 w-full rounded-[6px]"
              disabled={!isMyTurn || pending}
              onClick={() => setCounterOpen(true)}
            >
              Add New Offer
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full rounded-[6px] text-muted-foreground"
              disabled={pending}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            {!isMyTurn && (
              <p className="text-center text-xs text-muted-foreground">
                Waiting for {otherRole === "talent" ? "Talent" : "Organizer"}&apos;s Offer
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 rounded-md bg-white/5 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-foreground">Booking Detail</h2>
          <span className="text-xl font-bold text-foreground">{booking.package_title}</span>
          {booking.venue_city_name && (
            <span className="text-sm text-muted-foreground">{booking.venue_city_name}</span>
          )}
        </div>

        {booking.venue_address && (
          <div className="flex flex-col gap-1 border-t border-border pt-4">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Perform Address
            </span>
            <span className="text-sm text-foreground">{booking.venue_address}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Date</span>
            <span className="text-sm text-foreground">{booking.booked_date ?? "Flexible"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Time</span>
            <span className="text-sm text-foreground">
              {booking.package_start_time} - {booking.package_end_time}
            </span>
          </div>
        </div>

        {booking.package_description && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Note</span>
            <span className="text-sm text-foreground">{booking.package_description}</span>
          </div>
        )}

        {booking.package_working_method && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Working Method
            </span>
            <span className="text-sm text-foreground">{booking.package_working_method}</span>
          </div>
        )}

        {booking.package_skill_tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Skill Requirement
            </span>
            <div className="flex flex-wrap gap-2">
              {booking.package_skill_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {counterOpen && (
        <CounterOfferDialog
          bookingId={booking.id}
          currentOfferVnd={agreedOffer}
          onOpenChange={setCounterOpen}
          onSubmitted={() => {
            setCounterOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CounterOfferDialog({
  bookingId,
  currentOfferVnd,
  onOpenChange,
  onSubmitted,
}: {
  bookingId: string;
  currentOfferVnd: number;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const [amount, setAmount] = useState(String(currentOfferVnd));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit() {
    setError(undefined);
    setPending(true);
    const formData = new FormData();
    formData.set("offerVnd", amount);
    const result = await runAction(submitCounterOffer(bookingId, formData), { success: "Offer sent." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSubmitted();
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add new Offer</DialogTitle>
          <DialogDescription>Your offer request</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="offer-vnd" className="text-sm text-muted-foreground">
            Your offer request (VND)
          </Label>
          <Input
            id="offer-vnd"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 rounded-[6px]"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleSubmit} disabled={pending} className={cn("h-11 w-full rounded-[6px]")}>
          {pending ? "Sending..." : "Send Offer Request"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
