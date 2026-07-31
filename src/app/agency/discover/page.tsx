import { EventDiscoverContent } from "@/components/shell/event-discover-content";
import { listEventListings } from "@/lib/supabase/events";

export default async function AgencyDiscoverPage() {
  const listings = await listEventListings();

  return <EventDiscoverContent role="agency" listings={listings} />;
}
