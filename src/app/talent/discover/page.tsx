import { Suspense } from "react";
import { EventDiscoverContent } from "@/components/shell/event-discover-content";
import { EVENT_DISCOVER_PAGE_SIZE, resolveInitialEventFilters, searchEventListings } from "@/lib/supabase/events";
import { listCategories } from "@/lib/supabase/lookups";

export default async function TalentDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [categories, params] = await Promise.all([listCategories(), searchParams]);
  const filters = resolveInitialEventFilters(categories, params);
  const listings = await searchEventListings(filters, null, EVENT_DISCOVER_PAGE_SIZE);

  return (
    <Suspense>
      <EventDiscoverContent
        role="talent"
        categories={categories}
        initialListings={listings}
        initialHasMore={listings.length === EVENT_DISCOVER_PAGE_SIZE}
      />
    </Suspense>
  );
}
