"use client";

import { useState } from "react";
import { ChevronDown, DollarSign, Download, Ticket } from "lucide-react";
import { FilterPill } from "@/components/shell/filter-pill";
import { TimeRangeFilter } from "@/components/shell/time-range-filter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockBillingSummary, mockInvoiceGroups } from "@/lib/mock-account";

export function BillingContent() {
  const [openGroups, setOpenGroups] = useState<string[]>(mockInvoiceGroups.map((g) => g.event));

  function toggleGroup(event: string) {
    setOpenGroups((g) => (g.includes(event) ? g.filter((x) => x !== event) : [...g, event]));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-md bg-white/5 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground">
            <Ticket className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total Booking</span>
            <span className="text-lg font-bold text-foreground">{mockBillingSummary.totalBooking}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-md bg-white/5 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground">
            <DollarSign className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total Income</span>
            <span className="text-lg font-bold text-foreground">{mockBillingSummary.totalIncome}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-md bg-white/5 p-4">
          <span className="text-sm font-semibold text-foreground">Booking Information</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-2 py-1 text-muted-foreground">DATE FROM</span>
            <span className="text-foreground">
              {mockBillingSummary.bookingFrom} - {mockBillingSummary.bookingTo}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-2 py-1 text-muted-foreground">STATUS</span>
            <span className="text-foreground">{mockBillingSummary.status}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Booking from {mockBillingSummary.bookingFrom} - {mockBillingSummary.bookingTo}
          </h2>
          <Button variant="secondary" className="h-9 rounded-[6px]">
            <Download className="size-4" />
            Invoice PDF
          </Button>
        </div>

        <div className="flex gap-3">
          <FilterPill label="Category" defaultValue="All" options={["All", "Solo Singer", "Band", "DJ"]} />
          <TimeRangeFilter />
        </div>

        <div className="flex flex-col gap-3">
          {mockInvoiceGroups.map((group) => {
            const isOpen = openGroups.includes(group.event);
            return (
              <div key={group.event} className="overflow-hidden rounded-md bg-white/5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.event)}
                  className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-foreground"
                >
                  {group.event} / {group.venue}
                  <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="flex flex-col border-t border-border">
                    {group.lines.map((line, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-5 py-3 text-sm last:border-b-0"
                      >
                        <span className="text-foreground">{line.name}</span>
                        <span className="text-muted-foreground">{line.date}</span>
                        <span className="font-medium text-foreground">{line.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 rounded-md bg-white/5 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cost</span>
            <span className="text-foreground">{mockBillingSummary.cost}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">VAT/PIT</span>
            <span className="text-foreground">{mockBillingSummary.vatPit}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
            <span className="text-base font-semibold text-foreground">Total Cost</span>
            <span className="text-lg font-bold text-foreground">{mockBillingSummary.totalCost}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
