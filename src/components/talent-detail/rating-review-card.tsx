"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TalentDetail } from "@/lib/mock-talent-detail";

function StarRow({ count, size = "size-4" }: { count: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(size, i < count ? "fill-primary text-primary" : "text-white/20")}
        />
      ))}
    </div>
  );
}

export function RatingReviewCard({ talent }: { talent: TalentDetail }) {
  const [index, setIndex] = useState(0);
  const review = talent.reviews[index];

  function go(direction: 1 | -1) {
    setIndex((i) => (i + direction + talent.reviews.length) % talent.reviews.length);
  }

  return (
    <div className="grid grid-cols-[auto_1fr] gap-6 rounded-md bg-white/5 p-6">
      <div className="flex w-[160px] flex-col items-center justify-center gap-2 rounded-[8px] bg-white/5 px-6 py-4 text-center">
        <span className="text-5xl font-bold text-foreground">{talent.rating}</span>
        <StarRow count={Math.round(talent.rating)} />
        <span className="text-sm text-muted-foreground">{talent.reviewCount} reviews</span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-foreground">
              {review.reviewerName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{review.reviewerName}</span>
              <StarRow count={review.stars} size="size-3" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous review"
              onClick={() => go(-1)}
              className="flex size-7 items-center justify-center rounded-full bg-white/5 text-foreground hover:bg-white/10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next review"
              onClick={() => go(1)}
              className="flex size-7 items-center justify-center rounded-full bg-white/5 text-foreground hover:bg-white/10"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{review.title}</span>
            <span className="text-xs text-muted-foreground">
              Performed: {review.performedAt} &middot; Date: {review.date}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{review.body}</p>
        </div>
      </div>
    </div>
  );
}
