import { mapLookupNames } from "@/lib/supabase/lookups";
import { createClient } from "@/lib/supabase/server";
import type {
  CategoryOption,
  EventApplicationWithDetails,
  EventDiscoverCursor,
  EventDiscoverFilters,
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
      .select("full_name, city_id, bio, gallery_urls, social_links")
      .eq("id", event.organizer_id)
      .single(),
  ]);

  const [cityNames, categoryNames] = await Promise.all([
    mapLookupNames(supabase, "cities", [organizer?.city_id]),
    mapLookupNames(supabase, "categories", (slots ?? []).map((s) => s.category_id)),
  ]);

  return {
    ...event,
    slots: (slots ?? []).map((slot) => ({
      ...slot,
      category_name: categoryNames.get(slot.category_id) ?? "",
    })),
    organizer: organizer
      ? {
          full_name: organizer.full_name,
          bio: organizer.bio,
          gallery_urls: organizer.gallery_urls,
          social_links: organizer.social_links,
          city_name: organizer.city_id ? (cityNames.get(organizer.city_id) ?? null) : null,
        }
      : { full_name: "", city_name: null, bio: null, gallery_urls: [], social_links: [] },
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

export const EVENT_DISCOVER_PAGE_SIZE = 15;

/**
 * A page of upcoming events matching the given filters, sorted, and
 * keyset-paginated via `cursor` (the previous page's last row) instead of
 * OFFSET — see search_event_listings()'s migration for why.
 */
export async function searchEventListings(
  filters: EventDiscoverFilters,
  cursor: EventDiscoverCursor | null,
  limit: number
): Promise<EventListingSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_event_listings", {
    p_category: filters.category,
    p_date_start: filters.dateStart,
    p_date_end: filters.dateEnd,
    p_search: filters.search,
    p_sort: filters.sort,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_budget_min: cursor?.budgetMin ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: limit,
  });
  return data ?? [];
}

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

/** Resolves the sidebar/search URL params (?category=, ?q=) into the RPC's filter shape — shared by the agency and talent Discover pages, which are otherwise identical. */
export function resolveInitialEventFilters(
  categories: CategoryOption[],
  params: { category?: string | string[]; q?: string | string[] }
): EventDiscoverFilters {
  const categoryNames = categories.map((c) => c.name);
  const categoryParam = firstParam(params.category);
  return {
    category: categoryParam && categoryNames.includes(categoryParam) ? categoryParam : null,
    dateStart: null,
    dateEnd: null,
    search: firstParam(params.q),
    sort: "newest",
  };
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
    .select("id, event_id, category_id, price_usd")
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
  const categoryNames = await mapLookupNames(supabase, "categories", slots.map((s) => s.category_id));

  return applications.map((app) => {
    const slot = slotById.get(app.slot_id);
    const event = slot ? eventById.get(slot.event_id) : undefined;
    return {
      ...app,
      slot_category: (slot && categoryNames.get(slot.category_id)) ?? "",
      slot_price_usd: slot?.price_usd ?? 0,
      event_id: slot?.event_id ?? "",
      event_name: event?.name ?? "",
      event_date: event?.event_date ?? "",
      applicant_name: applicantNameById.get(app.applicant_profile_id) ?? "",
    };
  });
}
