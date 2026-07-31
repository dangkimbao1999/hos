"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { TalentDetail } from "@/lib/mock-talent-detail";

function formatVnd(amount: number) {
  return `${amount.toLocaleString("en-US")} VND`;
}

export function BookingPanel({ talent }: { talent: TalentDetail }) {
  const [loopSchedule, setLoopSchedule] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const visiblePackages = showAll ? talent.packages : talent.packages.slice(0, 3);

  return (
    <aside className="flex h-fit w-[380px] shrink-0 flex-col gap-5 rounded-md bg-white/5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
          {talent.name}&rsquo;s Performance Packages
        </h2>
        <p className="text-sm text-muted-foreground">Choose a package that fits your event</p>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-foreground">
        <Star className="size-4 fill-primary text-primary" />
        {talent.rating} Star ({talent.reviewCount} Review)
      </div>

      <Separator />

      <div className="flex items-baseline gap-2 text-foreground">
        <span className="text-sm text-muted-foreground">VND</span>
        <span className="text-lg font-bold">
          {formatVnd(talent.priceRangeVnd.min)} - {formatVnd(talent.priceRangeVnd.max)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="loop-schedule" className="text-sm font-medium text-foreground">
          Loop Schedule
        </Label>
        <Switch id="loop-schedule" checked={loopSchedule} onCheckedChange={setLoopSchedule} />
      </div>

      <RadioGroup
        value={String(selectedPackage)}
        onValueChange={(v) => setSelectedPackage(Number(v))}
        className="flex flex-col gap-3"
      >
        {visiblePackages.map((pkg, i) => (
          <Label
            key={i}
            htmlFor={`package-${i}`}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-[8px] border border-transparent bg-white/5 p-4 transition-colors",
              selectedPackage === i && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value={String(i)} id={`package-${i}`} className="mt-0.5" />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">{pkg.name}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-2 py-1 text-muted-foreground">TYPE</span>
                <span className="text-foreground">{pkg.type}</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-muted-foreground">LOCATION</span>
                <span className="font-medium text-foreground">{pkg.location}</span>
              </div>
            </div>
          </Label>
        ))}
      </RadioGroup>

      {talent.packages.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="flex items-center gap-1 self-start text-sm text-muted-foreground"
        >
          {showAll ? "Show less" : "Show more"}
          <ChevronDown className={cn("size-4 transition-transform", showAll && "rotate-180")} />
        </button>
      )}

      <Button asChild className="h-[52px] w-full rounded-[6px] text-base font-semibold">
        <Link href="/organizer/checkout">Add to Cart</Link>
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="w-auto flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="w-auto flex-1" />
      </div>

      <Button variant="secondary" className="h-[52px] w-full rounded-[6px] text-base font-semibold">
        Send Private Quotation
      </Button>
    </aside>
  );
}
