import { createClient } from "@/lib/supabase/server";
import type { EventListingSummary, EventWithSlots } from "@/lib/supabase/types";

/** Real event by slug, with its slots and organizer's display info — for the Event Detail page. */
export async function getEventBySlug(slug: string): Promise<EventWithSlots | null> {
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).single();
  if (!event) return null;

  const [{ data: slots }, { data: organizer }] = await Promise.all([
    supabase.from("event_slots").select("*").eq("event_id", event.id).order("created_at"),
    supabase.from("profiles").select("full_name, location").eq("id", event.organizer_id).single(),
  ]);

  return {
    ...event,
    slots: slots ?? [],
    organizer: organizer ?? { full_name: "", location: null },
  };
}

/** Upcoming events for Discover/Home listing cards. */
export async function listEventListings(limit?: number): Promise<EventListingSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("event_listing_summary")
    .select("*")
    .eq("status", "upcoming")
    .order("event_date", { ascending: true });
  if (limit) query = query.limit(limit);

  const { data } = await query;
  return data ?? [];
}

/** An organizer's own created events, with booked-talent counts — for Account > My Events. */
export async function listOrganizerEvents(organizerId: string): Promise<EventListingSummary[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("event_listing_summary")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("event_date", { ascending: false });

  return data ?? [];
}
