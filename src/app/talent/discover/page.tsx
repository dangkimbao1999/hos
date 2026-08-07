import { Suspense } from "react";
import { EventDiscoverContent } from "@/components/shell/event-discover-content";
import { listEventListings } from "@/lib/supabase/events";
import { listCategories } from "@/lib/supabase/lookups";

export default async function TalentDiscoverPage() {
  const [listings, categories] = await Promise.all([listEventListings(), listCategories()]);

  return (
    <Suspense>
      <EventDiscoverContent role="talent" listings={listings} categories={categories} />
    </Suspense>
  );
}
