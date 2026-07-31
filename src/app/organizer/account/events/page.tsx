import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockEvents } from "@/lib/mock-account";

const statusStyles: Record<string, string> = {
  Upcoming: "bg-primary/10 text-primary",
  Completed: "bg-green-500/10 text-green-500",
  Cancelled: "bg-white/10 text-muted-foreground",
};

export default function OrganizerEventsPage() {
  return (
    <AccountShell role="organizer">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mockEvents.length} events created</p>
        <Button asChild className="h-10 rounded-[6px]">
          <Link href="/organizer/create">Create new Event</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {mockEvents.map((event) => (
          <div
            key={event.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-white/5 p-5"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">{event.name}</span>
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusStyles[event.status])}>
                  {event.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {event.venue}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {event.talentCount} {event.talentCount === 1 ? "talent" : "talents"} booked
                </span>
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">{event.budget}</span>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}

