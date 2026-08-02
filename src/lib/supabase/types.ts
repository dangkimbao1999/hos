import type { Role } from "@/lib/nav-items";

export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Profile {
  id: string;
  role: Role;
  slug: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  kyc_status: KycStatus;
  notifications_read_at: string | null;
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
  updated_at: string;
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
  categories: string[];
}

/** Full event detail: the event row, its slots, and the organizer's profile. */
export interface EventWithSlots extends EventRow {
  slots: EventSlotRow[];
  organizer: Pick<Profile, "full_name" | "location">;
}

/** An application joined with its slot/event/applicant info — for the organizer's review UI. */
export interface EventApplicationWithDetails extends EventApplicationRow {
  slot_category: string;
  slot_price_usd: number;
  event_id: string;
  event_name: string;
  applicant_name: string;
}

export type PaymentMethod = "Prepaid" | "Postpaid";
export type PackageStatus = "active" | "closed";

export interface PackageRow {
  id: string;
  talent_id: string;
  category: string;
  sub_category: string | null;
  title: string;
  residency: string | null;
  location: string;
  repeat_on: boolean;
  repeat_days: string[] | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  description: string | null;
  price_min_vnd: number;
  price_max_vnd: number;
  payment_method: PaymentMethod;
  status: PackageStatus;
  created_at: string;
}

/** An active package joined with its talent's name/slug — for the organizer Discover grid. */
export interface PackageWithTalent extends PackageRow {
  talent_name: string;
  talent_slug: string;
}

export interface CartItemRow {
  id: string;
  organizer_id: string;
  package_id: string;
  price_vnd: number;
  booked_date: string | null;
  booked_time: string | null;
  created_at: string;
}

/** A cart item joined with its package + the talent who owns it — for the cart popover/checkout page. */
export interface CartItemWithPackage extends CartItemRow {
  package: Pick<PackageRow, "id" | "title" | "location">;
  talent: Pick<Profile, "id" | "full_name">;
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface PackageBookingRow {
  id: string;
  package_id: string;
  organizer_id: string;
  price_vnd: number;
  booked_date: string | null;
  booked_time: string | null;
  payment_method: PaymentMethod;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

/** A booking joined with the counterpart's name — for each role's Orders page. */
export interface BookingWithNames extends PackageBookingRow {
  package_title: string;
  organizer_name: string;
  talent_name: string;
}

export type NotificationKind =
  | "application_received"
  | "application_status"
  | "booking_received"
  | "booking_status"
  | "kyc_status";

/** Derived at query time from event_applications/package_bookings/kyc_submissions — not a stored table. */
export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  message: string;
  time: string;
  unread: boolean;
}
