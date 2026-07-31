"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, ImageIcon } from "lucide-react";
import { CardCarousel } from "@/components/shell/card-carousel";
import { ListingCard } from "@/components/shell/listing-card";
import { BookingPanel } from "@/components/talent-detail/booking-panel";
import { RatingReviewCard } from "@/components/talent-detail/rating-review-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { mockTalentDetail } from "@/lib/mock-talent-detail";
import { mockFeaturedListings } from "@/lib/mock-listings";
import type { PackageRow, Profile } from "@/lib/supabase/types";

const TABS = ["Overview", "Schedules", "Reviews", "About Talent"] as const;
type Tab = (typeof TABS)[number];

const mockAvailability = [
  { date: "12 Aug 2026", slot: "7:00 PM - 9:00 PM", status: "Available" },
  { date: "19 Aug 2026", slot: "8:00 PM - 10:00 PM", status: "Available" },
  { date: "26 Aug 2026", slot: "7:00 PM - 9:00 PM", status: "Booked" },
];

export function TalentDetailContent({
  talent,
  packages,
}: {
  talent: Profile;
  packages: PackageRow[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  // Rating/reviews/keywords/services/tagline have no real schema yet — kept
  // as generic mock flavor text alongside the real name/bio/packages.
  const mock = mockTalentDetail;
  const bio = talent.bio || mock.bio;

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="relative flex h-[280px] w-full flex-col justify-end overflow-hidden rounded-md">
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 text-muted-foreground">
          <ImageIcon className="size-10" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative flex flex-col gap-1 p-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-white">{talent.full_name}</h1>
          <span className="text-sm text-white/60">{mock.category}</span>
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
              <RatingReviewCard talent={mock} />

              <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">{mock.tagline}</h2>

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

              <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>

              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">Keyword</h3>
                <div className="flex flex-wrap gap-2">
                  {mock.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-white/5 px-4 py-2 text-sm text-foreground"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                  Service Provided
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-md bg-white/5 p-6">
                  {mock.services.map((service) => (
                    <div key={service} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                      <span className="text-sm text-foreground">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              <CardCarousel title="More Related Talents" viewAllHref="/organizer/discover">
                {mockFeaturedListings.map((item) => (
                  <ListingCard key={item.id} data={item} />
                ))}
              </CardCarousel>
            </>
          )}

          {tab === "Schedules" && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                Upcoming Availability
              </h2>
              {mockAvailability.map((slot) => (
                <div
                  key={slot.date}
                  className="flex items-center justify-between rounded-md bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="size-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{slot.date}</span>
                      <span className="text-xs text-muted-foreground">{slot.slot}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      slot.status === "Available"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-white/10 text-muted-foreground"
                    )}
                  >
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "Reviews" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                {mock.reviewCount} Reviews
              </h2>
              {mock.reviews.map((review, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-md bg-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-foreground">
                        {review.reviewerName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {review.reviewerName}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{review.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Performed: {review.performedAt} &middot; Date: {review.date}
                  </span>
                  <p className="text-sm text-muted-foreground">{review.body}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "About Talent" && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                  About {talent.full_name}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                  Service Provided
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-md bg-white/5 p-6">
                  {mock.services.map((service) => (
                    <div key={service} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                      <span className="text-sm text-foreground">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <BookingPanel talentName={talent.full_name} packages={packages} />
      </div>
    </div>
  );
}
