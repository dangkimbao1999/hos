"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAccountNavItems } from "@/lib/account-nav";
import type { Role } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function AccountTabs({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = getAccountNavItems(role);

  return (
    <div className="scrollbar-hide flex gap-3 overflow-x-auto">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-[8px] px-6 py-3 text-sm font-medium tracking-[-0.03em] transition-colors",
              active ? "bg-foreground text-background" : "bg-white/5 text-foreground hover:bg-white/10"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
