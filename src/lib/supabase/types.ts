import type { Role } from "@/lib/nav-items";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

/** Profile row plus the auth email, which lives on auth.users, not profiles. */
export interface CurrentUser extends Profile {
  email: string;
}

export type EventStatus = "upcoming" | "completed" | "cancelled";

export interface EventRow {
  id: string;
  organizer_id: string;
  slug: string;
  name: string;
  venue: string;
  address: string;
  event_date: string;
  start_time: string;
  end_time: string;
  tagline: string | null;
  description: string | null;
  budget_min_vnd: number | null;
  budget_max_vnd: number | null;
  contact_phone: string | null;
  expected_guests: number | null;
  special_requirements: string | null;
  status: EventStatus;
  created_at: string;
}

export interface EventSlotRow {
  id: string;
  event_id: string;
  category: string;
  price_usd: number;
  slot_type: string;
  quantity_total: number;
  created_at: string;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface EventApplicationRow {
  id: string;
  slot_id: string;
  applicant_profile_id: string;
  offer_amount_usd: number | null;
  status: ApplicationStatus;
  created_at: string;
}

/** Row from the event_listing_summary view — for Discover/Home cards. */
export interface EventListingSummary {
  id: string;
  slug: string;
  name: string;
  venue: string;
  address: string;
  event_date: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  organizer_id: string;
  created_at: string;
  total_slots: number;
  filled_slots: number;
  budget_min_vnd: number | null;
  budget_max_vnd: number | null;
}

/** Full event detail: the event row, its slots, and the organizer's profile. */
export interface EventWithSlots extends EventRow {
  slots: EventSlotRow[];
  organizer: Pick<Profile, "full_name" | "location">;
}
