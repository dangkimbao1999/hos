import { Suspense } from "react";
import { EventDiscoverContent } from "@/components/shell/event-discover-content";
import { listEventListings } from "@/lib/supabase/events";
import { listCategories } from "@/lib/supabase/lookups";

export default async function AgencyDiscoverPage() {
  const [listings, categories] = await Promise.all([listEventListings(), listCategories()]);

  return (
    <Suspense>
      <EventDiscoverContent role="agency" listings={listings} categories={categories} />
    </Suspense>
  );
}
