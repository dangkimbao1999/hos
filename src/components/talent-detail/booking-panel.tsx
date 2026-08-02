"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { addToCart } from "@/lib/supabase/package-actions";
import type { PackageRow } from "@/lib/supabase/types";

function formatVnd(amount: number) {
  return `${amount.toLocaleString("en-US")} VND`;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** Whether a chosen date falls on one of the package's repeat days (always true for one-time packages). */
function allowedWeekday(pkg: PackageRow, dateStr: string): boolean {
  if (!pkg.repeat_on || !pkg.repeat_days || pkg.repeat_days.length === 0) return true;
  const weekday = WEEKDAYS[new Date(`${dateStr}T00:00:00`).getDay()];
  return pkg.repeat_days.includes(weekday);
}

export function BookingPanel({
  talentName,
  packages,
}: {
  talentName: string;
  packages: PackageRow[];
}) {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [bookedDate, setBookedDate] = useState("");
  const [bookedTime, setBookedTime] = useState("");

  const visiblePackages = showAll ? packages : packages.slice(0, 3);
  const hasPackages = packages.length > 0;
  const priceMin = hasPackages ? Math.min(...packages.map((p) => p.price_min_vnd)) : 0;
  const priceMax = hasPackages ? Math.max(...packages.map((p) => p.price_max_vnd)) : 0;
  const selectedPkg = packages[selectedPackage];

  function handleSelectPackage(index: number) {
    setSelectedPackage(index);
    setBookedDate("");
    setBookedTime(packages[index]?.start_time.slice(0, 5) ?? "");
  }

  async function handleAddToCart() {
    if (!selectedPkg) return;
    if (!bookedDate) {
      setError("Choose a date for this booking.");
      return;
    }
    if (!allowedWeekday(selectedPkg, bookedDate)) {
      setError(`This package is only available on: ${selectedPkg.repeat_days?.join(", ")}.`);
      return;
    }
    setError(undefined);
    setPending(true);
    const formData = new FormData();
    formData.set("packageId", selectedPkg.id);
    formData.set("priceVnd", String(selectedPkg.price_min_vnd));
    formData.set("bookedDate", bookedDate);
    formData.set("bookedTime", bookedTime);
    const result = await addToCart(formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push("/organizer/checkout");
  }

  return (
    <aside className="flex h-fit w-[380px] shrink-0 flex-col gap-5 rounded-md bg-white/5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
          {talentName}&rsquo;s Performance Packages
        </h2>
        <p className="text-sm text-muted-foreground">Choose a package that fits your event</p>
      </div>

      <Separator />

      {hasPackages ? (
        <>
          <div className="flex items-baseline gap-2 text-foreground">
            <span className="text-sm text-muted-foreground">VND</span>
            <span className="text-lg font-bold">
              {formatVnd(priceMin)} - {formatVnd(priceMax)}
            </span>
          </div>

          <RadioGroup
            value={String(selectedPackage)}
            onValueChange={(v) => handleSelectPackage(Number(v))}
            className="flex flex-col gap-3"
          >
            {visiblePackages.map((pkg, i) => (
              <Label
                key={pkg.id}
                htmlFor={`package-${pkg.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[8px] border border-transparent bg-white/5 p-4 transition-colors",
                  selectedPackage === i && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value={String(i)} id={`package-${pkg.id}`} className="mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{pkg.title}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-2 py-1 text-muted-foreground">LOCATION</span>
                    <span className="font-medium text-foreground">{pkg.location}</span>
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>

          {packages.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-1 self-start text-sm text-muted-foreground"
            >
              {showAll ? "Show less" : "Show more"}
              <ChevronDown className={cn("size-4 transition-transform", showAll && "rotate-180")} />
            </button>
          )}

          {selectedPkg && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-muted-foreground">Booking Date &amp; Time</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={bookedDate}
                  min={selectedPkg.start_date}
                  max={selectedPkg.end_date}
                  onChange={(e) => setBookedDate(e.target.value)}
                  className="h-11 rounded-[6px]"
                  aria-label="Booking date"
                />
                <Input
                  type="time"
                  value={bookedTime}
                  min={selectedPkg.start_time.slice(0, 5)}
                  max={selectedPkg.end_time.slice(0, 5)}
                  onChange={(e) => setBookedTime(e.target.value)}
                  className="h-11 rounded-[6px]"
                  aria-label="Booking time"
                />
              </div>
              {selectedPkg.repeat_on && selectedPkg.repeat_days && selectedPkg.repeat_days.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Available on: {selectedPkg.repeat_days.join(", ")}
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            disabled={pending}
            onClick={handleAddToCart}
            className="h-[52px] w-full rounded-[6px] text-base font-semibold"
          >
            {pending ? "Adding..." : "Add to Cart"}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">This talent hasn&rsquo;t published any packages yet.</p>
      )}
    </aside>
  );
}
