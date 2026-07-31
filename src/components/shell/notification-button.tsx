"use client";

import { Bell, CreditCard, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { mockNotifications } from "@/lib/mock-notifications";

export function NotificationButton() {
  const hasUnread = mockNotifications.some((n) => n.unread);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
        >
          <Bell className="size-[22px] text-foreground" />
          {hasUnread && <span className="absolute top-2 right-2 size-2.5 rounded-full bg-primary" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex max-h-[420px] flex-col divide-y divide-border overflow-y-auto">
          {mockNotifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground">
                {n.kind === "payment" ? (
                  <CreditCard className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </span>
              <p className="flex-1 text-sm text-foreground">
                {n.kind === "payment" ? (
                  <>
                    Your payment at <span className="font-semibold">{n.time}</span> has complete.
                    Please check Your Order to view detail and position to events
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{n.applicantName}</span> applied to your{" "}
                    {n.eventName}. View detail on Your Events
                  </>
                )}
              </p>
              {n.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
