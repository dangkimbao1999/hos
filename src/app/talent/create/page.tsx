"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { EventHomeContent } from "@/components/shell/event-home-content";
import { CreatePackageDialog } from "@/components/create-package/create-package-dialog";

export default function TalentCreatePackagePage() {
  const [open, setOpen] = useState(true);

  return (
    <AppShell role="talent">
      <EventHomeContent role="talent" />
      <CreatePackageDialog role="talent" open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
