"use client";

import { useState } from "react";
import { ImageIcon, MapPin } from "lucide-react";
import { ApplyPanel } from "@/components/event-detail/apply-panel";
import { CardCarousel } from "@/components/shell/card-carousel";
import { EventListingCard } from "@/components/shell/event-listing-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockEventDetail } from "@/lib/mock-event-detail";
import { mockUpcomingEvents } from "@/lib/mock-event-listings";
import type { Role } from "@/lib/nav-items";

const TABS = ["Overview", "About Organizer"] as const;
type Tab = (typeof TABS)[number];

export function EventDetailContent({ role }: { role: Role }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const event = mockEventDetail;

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="relative flex h-[280px] w-full flex-col justify-end overflow-hidden rounded-md">
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 text-muted-foreground">
          <ImageIcon className="size-10" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative flex flex-col gap-2 p-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-white">{event.name}</h1>
          <span className="text-sm text-white/60">
            {event.venue} &middot; {event.address}
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white">
              DAY <span className="font-semibold">{event.day}</span>
            </span>
            <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white">
              TIME <span className="font-semibold">{event.time}</span>
            </span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="h-auto w-fit gap-3 rounded-none bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-[8px] border-none bg-white/5 px-6 py-3 text-sm font-medium text-foreground shadow-none data-active:bg-foreground data-active:text-background dark:data-active:bg-foreground dark:data-active:text-background"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {tab === "Overview" && (
            <>
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">{event.tagline}</h2>

              <div className="flex flex-col gap-3">
                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md bg-white/10 text-muted-foreground">
                  <ImageIcon className="size-10" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-white/10 text-muted-foreground"
                    >
                      <ImageIcon className="size-6" />
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">{event.bio}</p>

              <CardCarousel title="More Upcoming Events" viewAllHref={`/${role}/discover`}>
                {mockUpcomingEvents.map((item) => (
                  <EventListingCard key={item.id} data={item} />
                ))}
              </CardCarousel>
            </>
          )}

          {tab === "About Organizer" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                {event.organizer.name}
              </h2>
              <div className="flex flex-col gap-3 rounded-md bg-white/5 p-5">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  {event.organizer.location}
                </div>
                <div className="text-sm text-muted-foreground">Contact: {event.organizer.contact}</div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{event.bio}</p>
            </div>
          )}
        </div>

        <ApplyPanel event={event} role={role} />
      </div>
    </div>
  );
}
