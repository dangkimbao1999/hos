"use client";

import { useState } from "react";
import { Bell, CreditCard, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markNotificationsRead } from "@/lib/supabase/notification-actions";
import { runAction } from "@/lib/toast-action";
import type { NotificationItem } from "@/lib/supabase/types";

const PERSON_KINDS = new Set([
  "application_received",
  "application_status",
  "booking_received",
  "quotation_received",
  "quotation_responded",
]);

export function NotificationButton({ notifications }: { notifications: NotificationItem[] }) {
  const [items, setItems] = useState(notifications);
  const hasUnread = items.some((n) => n.unread);

  async function handleOpenChange(open: boolean) {
    if (open && hasUnread) {
      setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
      await runAction(markNotificationsRead());
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
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
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground">
                  {PERSON_KINDS.has(n.kind) ? <User className="size-4" /> : <CreditCard className="size-4" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                </div>
                {n.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
