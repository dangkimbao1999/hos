import { Suspense } from "react";
import { DiscoverContent } from "@/components/shell/discover-content";
import { listDiscoverPackages } from "@/lib/supabase/packages";

export default async function OrganizerDiscoverPage() {
  const packages = await listDiscoverPackages();
  return (
    <Suspense>
      <DiscoverContent role="organizer" packages={packages} />
    </Suspense>
  );
}

