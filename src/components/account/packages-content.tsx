"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { CreatePackageDialog } from "@/components/create-package/create-package-dialog";
import { FilterPill } from "@/components/shell/filter-pill";
import { PriceRangeFilter } from "@/components/shell/price-range-filter";
import { TimeRangeFilter } from "@/components/shell/time-range-filter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { mockPackages } from "@/lib/mock-account";
import type { Role } from "@/lib/nav-items";
import type { PackageRow } from "@/lib/supabase/types";

const statusStyles: Record<string, string> = {
  Active: "text-green-500",
  Closed: "text-destructive",
};

function formatVnd(n: number) {
  return `${n.toLocaleString("en-US")} VND`;
}

interface DisplayPackage {
  id: string;
  name: string;
  bookingCount: number;
  priceRange: string;
  status: "Active" | "Closed";
}

export function PackagesContent({
  role,
  packages,
}: {
  role: Role;
  packages?: (PackageRow & { bookingCount: number })[];
}) {
  const [createOpen, setCreateOpen] = useState(false);

  const rows: DisplayPackage[] = packages
    ? packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.title,
        bookingCount: pkg.bookingCount,
        priceRange: `${formatVnd(pkg.price_min_vnd)} - ${formatVnd(pkg.price_max_vnd)}`,
        status: pkg.status === "active" ? "Active" : "Closed",
      }))
    : mockPackages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        bookingCount: pkg.bookingCount,
        priceRange: pkg.priceRange,
        status: pkg.status,
      }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <FilterPill label="Category" defaultValue="All" options={["All", "Solo Singer", "Band", "DJ"]} />
          <FilterPill label="Location" defaultValue="HCM City" options={["HCM City", "Hanoi", "Da Nang"]} />
          <PriceRangeFilter />
          <TimeRangeFilter />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-input px-4 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by package, location..."
              className="w-56 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)} className="h-10 shrink-0 rounded-[6px]">
            <Plus className="size-4" />
            Create new Package
          </Button>
          <CreatePackageDialog role={role} open={createOpen} onOpenChange={setCreateOpen} />
        </div>
      </div>

      <div className="overflow-hidden rounded-md bg-white/5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Package name</TableHead>
              <TableHead>Bookings Count</TableHead>
              <TableHead>Price Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((pkg) => (
              <TableRow key={pkg.id} className="hover:bg-transparent">
                <TableCell className="font-medium text-foreground">{pkg.name}</TableCell>
                <TableCell>{pkg.bookingCount} Booked</TableCell>
                <TableCell>{pkg.priceRange}</TableCell>
                <TableCell>
                  <span className={cn("font-medium", statusStyles[pkg.status])}>{pkg.status}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <button className="flex size-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:bg-white/10">
                      <Pencil className="size-3.5" />
                    </button>
                    <button className="flex size-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:bg-white/10">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
