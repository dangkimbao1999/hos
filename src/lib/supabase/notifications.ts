import { createClient } from "@/lib/supabase/server";
import { mapLookupNames } from "@/lib/supabase/lookups";
import type { NotificationItem, NotificationKind } from "@/lib/supabase/types";
import type { Role } from "@/lib/nav-items";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${hh}:${mm} ${dd}/${mo}/${d.getFullYear()}`;
}

interface RawNotification {
  kind: NotificationKind;
  message: string;
  at: string;
}

function toItems(raw: RawNotification[], readAt: string | null): NotificationItem[] {
  return raw
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((n, i) => ({
      id: `${n.kind}-${i}-${n.at}`,
      kind: n.kind,
      message: n.message,
      time: formatTime(n.at),
      unread: !readAt || n.at > readAt,
    }));
}

/** Notifications derived from recent status changes on things the profile owns — not a stored table. */
export async function listNotifications(
  profileId: string,
  role: Role,
  notificationsReadAt: string | null
): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const raw: RawNotification[] = [];

  if (role === "organizer") {
    const { data: myEvents } = await supabase
      .from("events")
      .select("id, name")
      .eq("organizer_id", profileId);

    if (myEvents && myEvents.length > 0) {
      const eventById = new Map(myEvents.map((e) => [e.id, e]));
      const { data: slots } = await supabase
        .from("event_slots")
        .select("id, event_id, category_id")
        .in("event_id", myEvents.map((e) => e.id));

      if (slots && slots.length > 0) {
        const slotById = new Map(slots.map((s) => [s.id, s]));
        const { data: applications } = await supabase
          .from("event_applications")
          .select("applicant_profile_id, slot_id, created_at")
          .in("slot_id", slots.map((s) => s.id));

        if (applications && applications.length > 0) {
          const applicantIds = [...new Set(applications.map((a) => a.applicant_profile_id))];
          const { data: applicants } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", applicantIds);
          const nameById = new Map((applicants ?? []).map((p) => [p.id, p.full_name]));
          const categoryNameById = await mapLookupNames(supabase, "categories", slots.map((s) => s.category_id));

          for (const app of applications) {
            const slot = slotById.get(app.slot_id);
            const event = slot ? eventById.get(slot.event_id) : undefined;
            if (!slot || !event) continue;
            const categoryName = categoryNameById.get(slot.category_id) ?? "";
            raw.push({
              kind: "application_received",
              message: `${nameById.get(app.applicant_profile_id) ?? "A talent"} applied to your ${event.name} (${categoryName}).`,
              at: app.created_at,
            });
          }
        }
      }
    }

    const { data: bookings } = await supabase
      .from("package_bookings")
      .select("package_id, status, awaiting_response_from, talent_marked_complete_at, updated_at")
      .eq("organizer_id", profileId)
      .in("status", ["confirmed", "cancelled", "dealing"]);

    // A 'dealing' booking only means something is outstanding — only notify
    // when it's actually this organizer's turn to respond.
    const relevantBookings = (bookings ?? []).filter(
      (b) => b.status !== "dealing" || b.awaiting_response_from === "organizer"
    );

    if (relevantBookings.length > 0) {
      const { data: packages } = await supabase
        .from("packages")
        .select("id, title, talent_id")
        .in("id", relevantBookings.map((b) => b.package_id));
      const packageById = new Map((packages ?? []).map((p) => [p.id, p]));
      const talentIds = [...new Set((packages ?? []).map((p) => p.talent_id))];
      const { data: talents } = await supabase.from("profiles").select("id, full_name").in("id", talentIds);
      const talentNameById = new Map((talents ?? []).map((p) => [p.id, p.full_name]));

      for (const booking of relevantBookings) {
        const pkg = packageById.get(booking.package_id);
        if (!pkg) continue;
        if (booking.status === "dealing") {
          raw.push({
            kind: "counter_offer_received",
            message: `${talentNameById.get(pkg.talent_id) ?? "The talent"} sent a new offer for ${pkg.title}.`,
            at: booking.updated_at,
          });
        } else {
          raw.push({
            kind: "booking_status",
            message:
              booking.status === "confirmed"
                ? `Your booking for ${pkg.title} was confirmed.`
                : `Your booking for ${pkg.title} was rejected.`,
            at: booking.updated_at,
          });
        }
        if (booking.talent_marked_complete_at) {
          raw.push({
            kind: "booking_marked_complete_by_talent",
            message: `${talentNameById.get(pkg.talent_id) ?? "The talent"} marked ${pkg.title} as complete — confirm to finish this booking.`,
            at: booking.talent_marked_complete_at,
          });
        }
      }
    }

    const { data: respondedQuotations } = await supabase
      .from("quotations")
      .select("event_name, talent_id, status, updated_at")
      .eq("organizer_id", profileId)
      .in("status", ["quoted", "declined"]);

    if (respondedQuotations && respondedQuotations.length > 0) {
      const talentIds = [...new Set(respondedQuotations.map((q) => q.talent_id))];
      const { data: talents } = await supabase.from("profiles").select("id, full_name").in("id", talentIds);
      const talentNameById = new Map((talents ?? []).map((p) => [p.id, p.full_name]));

      for (const q of respondedQuotations) {
        raw.push({
          kind: "quotation_responded",
          message:
            q.status === "quoted"
              ? `${talentNameById.get(q.talent_id) ?? "The talent"} sent you a quote for ${q.event_name}.`
              : `${talentNameById.get(q.talent_id) ?? "The talent"} declined your quote request for ${q.event_name}.`,
          at: q.updated_at,
        });
      }
    }
  } else if (role === "talent") {
    const { data: myPackages } = await supabase.from("packages").select("id, title").eq("talent_id", profileId);

    if (myPackages && myPackages.length > 0) {
      const packageById = new Map(myPackages.map((p) => [p.id, p]));
      const { data: bookings } = await supabase
        .from("package_bookings")
        .select("organizer_id, package_id, status, awaiting_response_from, created_at, updated_at")
        .in("package_id", myPackages.map((p) => p.id));

      if (bookings && bookings.length > 0) {
        const organizerIds = [...new Set(bookings.map((b) => b.organizer_id))];
        const { data: organizers } = await supabase.from("profiles").select("id, full_name").in("id", organizerIds);
        const nameById = new Map((organizers ?? []).map((p) => [p.id, p.full_name]));

        for (const booking of bookings) {
          const pkg = packageById.get(booking.package_id);
          if (!pkg) continue;
          raw.push({
            kind: "booking_received",
            message: `${nameById.get(booking.organizer_id) ?? "An organizer"} booked your ${pkg.title}.`,
            at: booking.created_at,
          });
          if (booking.status === "dealing" && booking.awaiting_response_from === "talent") {
            raw.push({
              kind: "counter_offer_received",
              message: `${nameById.get(booking.organizer_id) ?? "An organizer"} sent a new offer for ${pkg.title}.`,
              at: booking.updated_at,
            });
          }
        }
      }
    }

    const { data: applications } = await supabase
      .from("event_applications")
      .select("slot_id, status, updated_at")
      .eq("applicant_profile_id", profileId)
      .in("status", ["accepted", "rejected"]);

    if (applications && applications.length > 0) {
      const { data: slots } = await supabase
        .from("event_slots")
        .select("id, event_id, category_id")
        .in("id", applications.map((a) => a.slot_id));
      const slotById = new Map((slots ?? []).map((s) => [s.id, s]));

      const eventIds = [...new Set((slots ?? []).map((s) => s.event_id))];
      const { data: events } = await supabase.from("events").select("id, name").in("id", eventIds);
      const eventById = new Map((events ?? []).map((e) => [e.id, e]));
      const categoryNameById = await mapLookupNames(supabase, "categories", (slots ?? []).map((s) => s.category_id));

      for (const app of applications) {
        const slot = slotById.get(app.slot_id);
        const event = slot ? eventById.get(slot.event_id) : undefined;
        if (!slot || !event) continue;
        const categoryName = categoryNameById.get(slot.category_id) ?? "";
        raw.push({
          kind: "application_status",
          message:
            app.status === "accepted"
              ? `Your application to ${event.name} (${categoryName}) was accepted.`
              : `Your application to ${event.name} (${categoryName}) was rejected.`,
          at: app.updated_at,
        });
      }
    }

    const { data: newQuotations } = await supabase
      .from("quotations")
      .select("event_name, organizer_id, created_at")
      .eq("talent_id", profileId)
      .eq("status", "pending");

    if (newQuotations && newQuotations.length > 0) {
      const organizerIds = [...new Set(newQuotations.map((q) => q.organizer_id))];
      const { data: organizers } = await supabase.from("profiles").select("id, full_name").in("id", organizerIds);
      const nameById = new Map((organizers ?? []).map((p) => [p.id, p.full_name]));

      for (const q of newQuotations) {
        raw.push({
          kind: "quotation_received",
          message: `${nameById.get(q.organizer_id) ?? "An organizer"} requested a quote for ${q.event_name}.`,
          at: q.created_at,
        });
      }
    }
  }

  const { data: kycSubmissions } = await supabase
    .from("kyc_submissions")
    .select("status, reviewed_at, created_at")
    .eq("profile_id", profileId)
    .in("status", ["verified", "rejected"]);

  for (const sub of kycSubmissions ?? []) {
    raw.push({
      kind: "kyc_status",
      message:
        sub.status === "verified"
          ? "Your KYC verification was approved."
          : "Your KYC verification was rejected.",
      at: sub.reviewed_at ?? sub.created_at,
    });
  }

  return toItems(raw, notificationsReadAt);
}
