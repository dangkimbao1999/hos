"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { mockCartPreview } from "@/lib/mock-notifications";
import type { Role } from "@/lib/nav-items";

export function CartButton({ role }: { role: Role }) {
  const count = mockCartPreview.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Cart"
          className="relative flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
        >
          <ShoppingCart className="size-[22px] text-foreground" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex max-h-[400px] flex-col divide-y divide-border overflow-y-auto">
          {mockCartPreview.map((group) => (
            <div key={group.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground">
                  <User className="size-4" />
                </span>
                <span className="flex-1 text-sm font-semibold text-foreground">
                  {group.talentName}
                </span>
                <span className="text-sm font-semibold text-foreground">{group.totalVnd}</span>
              </div>
              <div className="flex flex-col gap-1 pl-12">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.label}</span>
                    <span>{item.priceVnd}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3">
          <Button asChild className="h-11 w-full rounded-[6px]">
            <Link href={`/${role}/checkout`}>Go Check Out</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
