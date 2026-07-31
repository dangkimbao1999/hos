"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockOrders } from "@/lib/mock-account";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-500",
  Confirmed: "bg-blue-500/10 text-blue-400",
  Completed: "bg-green-500/10 text-green-500",
  Cancelled: "bg-white/10 text-muted-foreground",
};

const SUB_FILTERS = ["All", "Upcoming", "Pending", "Pending done", "Wait to confirm", "Done", "Canceled"];

export function OrdersContent() {
  const [activeFilter, setActiveFilter] = useState(SUB_FILTERS[0]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {SUB_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeFilter === filter
                  ? "bg-foreground text-background"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-input px-4 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by events name..."
            className="w-56 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-md bg-white/5">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span>Order</span>
          <span>Talent</span>
          <span>Date</span>
          <span>Price</span>
          <span>Status</span>
        </div>
        {mockOrders.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0"
          >
            <span className="text-muted-foreground">{order.id}</span>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{order.talentName}</span>
              <span className="text-xs text-muted-foreground">{order.packageName}</span>
            </div>
            <span className="text-foreground">{order.date}</span>
            <span className="font-semibold text-foreground">{order.priceVnd}</span>
            <span
              className={cn("w-fit rounded-full px-3 py-1 text-xs font-medium", statusStyles[order.status])}
            >
              {order.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
