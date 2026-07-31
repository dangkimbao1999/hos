"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getEquivalentPath } from "@/lib/role-switch";
import type { Role } from "@/lib/nav-items";

const roleLabels: Record<Role, string> = {
  organizer: "Organizer",
  talent: "Talent",
  agency: "Agency",
};

const roles: Role[] = ["organizer", "talent", "agency"];

export function RoleSwitcher({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex shrink-0 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.15)] bg-white/[0.05] px-4 py-2.5 text-sm text-foreground outline-none transition-colors hover:bg-white/10">
        <LayoutDashboard className="size-4 text-muted-foreground" />
        <span className="font-medium">{roleLabels[role]}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Test as role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((r) => (
          <DropdownMenuItem
            key={r}
            onSelect={() => router.push(getEquivalentPath(pathname, role, r))}
            className="justify-between"
          >
            {roleLabels[r]}
            {r === role && <span className="text-xs text-primary">Current</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
