import { EventDiscoverContent } from "@/components/shell/event-discover-content";
import { listEventListings } from "@/lib/supabase/events";

export default async function TalentDiscoverPage() {
  const listings = await listEventListings();

  return <EventDiscoverContent role="talent" listings={listings} />;
}
