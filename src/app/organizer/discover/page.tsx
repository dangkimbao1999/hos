import { Suspense } from "react";
import { DiscoverContent } from "@/components/shell/discover-content";

export default function OrganizerDiscoverPage() {
  return (
    <Suspense>
      <DiscoverContent role="organizer" />
    </Suspense>
  );
}

