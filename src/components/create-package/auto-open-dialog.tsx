"use client";

import { useState } from "react";
import { CreatePackageDialog } from "@/components/create-package/create-package-dialog";
import type { Role } from "@/lib/nav-items";
import type { CategoryOption, LookupOption } from "@/lib/supabase/types";

/**
 * Wraps CreatePackageDialog with its own open-state so the /create pages can
 * stay Server Components (EventHomeContent fetches real data and can't be
 * imported into a "use client" file) while still auto-opening the dialog.
 */
export function AutoOpenCreatePackageDialog({
  role,
  categories,
  cities,
}: {
  role: Role;
  categories: CategoryOption[];
  cities: LookupOption[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <CreatePackageDialog
      role={role}
      open={open}
      onOpenChange={setOpen}
      categories={categories}
      cities={cities}
    />
  );
}
