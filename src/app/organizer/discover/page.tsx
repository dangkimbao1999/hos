import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { DiscoverContent } from "@/components/shell/discover-content";

export default function OrganizerDiscoverPage() {
  return (
    <AppShell role="organizer">
      <Suspense>
        <DiscoverContent role="organizer" />
      </Suspense>
    </AppShell>
  );
}
