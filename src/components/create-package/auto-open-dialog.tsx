"use client";

import { useState } from "react";
import { CreatePackageDialog } from "@/components/create-package/create-package-dialog";
import type { Role } from "@/lib/nav-items";

/**
 * Wraps CreatePackageDialog with its own open-state so the /create pages can
 * stay Server Components (EventHomeContent fetches real data and can't be
 * imported into a "use client" file) while still auto-opening the dialog.
 */
export function AutoOpenCreatePackageDialog({ role }: { role: Role }) {
  const [open, setOpen] = useState(true);
  return <CreatePackageDialog role={role} open={open} onOpenChange={setOpen} />;
}
