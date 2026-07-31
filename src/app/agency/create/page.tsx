"use client";

import { useState } from "react";
import { EventHomeContent } from "@/components/shell/event-home-content";
import { CreatePackageDialog } from "@/components/create-package/create-package-dialog";

export default function AgencyCreatePackagePage() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <EventHomeContent role="agency" />
      <CreatePackageDialog role="agency" open={open} onOpenChange={setOpen} />
    </>
  );
}

