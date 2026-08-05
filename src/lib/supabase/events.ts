import { createClient } from "@/lib/supabase/server";
import type {
  EventApplicationWithDetails,
  EventListingSummary,
  EventWithSlots,
} from "@/lib/supabase/types";

/** Real event by slug, with its slots and organizer's display info — for the Event Detail page. */
export async function getEventBySlug(slug: string): Promise<EventWithSlots | null> {
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).single();
  if (!event) return null;

  const [{ data: slots }, { data: organizer }] = await Promise.all([
    supabase.from("event_slots").select("*").eq("event_id", event.id).order("created_at"),
    supabase
      .from("profiles")
      .select("full_name, location, bio, gallery_urls, social_links")
      .eq("id", event.organizer_id)
      .single(),
  ]);

  return {
    ...event,
    slots: slots ?? [],
    organizer: organizer ?? { full_name: "", location: null, bio: null, gallery_urls: [], social_links: [] },
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

/** Every application to any of an organizer's events — for reviewing/accepting on Account > My Events. */
export async function listApplicationsForOrganizer(
  organizerId: string
): Promise<EventApplicationWithDetails[]> {
  const supabase = await createClient();

  const { data: myEvents } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("organizer_id", organizerId);
  if (!myEvents || myEvents.length === 0) return [];
  const eventById = new Map(myEvents.map((e) => [e.id, e]));

  const { data: slots } = await supabase
    .from("event_slots")
    .select("id, event_id, category, price_usd")
    .in("event_id", myEvents.map((e) => e.id));
  if (!slots || slots.length === 0) return [];
  const slotById = new Map(slots.map((s) => [s.id, s]));

  const { data: applications } = await supabase
    .from("event_applications")
    .select("*")
    .in("slot_id", slots.map((s) => s.id))
    .order("created_at", { ascending: false });
  if (!applications || applications.length === 0) return [];

  const applicantIds = [...new Set(applications.map((a) => a.applicant_profile_id))];
  const { data: applicants } = await supabase.from("profiles").select("id, full_name").in("id", applicantIds);
  const applicantNameById = new Map((applicants ?? []).map((p) => [p.id, p.full_name]));

  return applications.map((app) => {
    const slot = slotById.get(app.slot_id);
    const event = slot ? eventById.get(slot.event_id) : undefined;
    return {
      ...app,
      slot_category: slot?.category ?? "",
      slot_price_usd: slot?.price_usd ?? 0,
      event_id: slot?.event_id ?? "",
      event_name: event?.name ?? "",
      event_date: event?.event_date ?? "",
      applicant_name: applicantNameById.get(app.applicant_profile_id) ?? "",
    };
  });
}
