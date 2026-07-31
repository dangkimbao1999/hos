import { notFound } from "next/navigation";
import { EventDetailContent } from "@/components/event-detail/event-detail-content";
import { getEventBySlug, listEventListings } from "@/lib/supabase/events";

export default async function AgencyEventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, moreEvents] = await Promise.all([getEventBySlug(slug), listEventListings(4)]);
  if (!event) notFound();

  return <EventDetailContent role="agency" event={event} moreEvents={moreEvents} />;
}
