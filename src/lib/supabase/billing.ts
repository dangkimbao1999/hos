import { createClient } from "@/lib/supabase/server";
import { mapLookupNames } from "@/lib/supabase/lookups";
import type { Role } from "@/lib/nav-items";

/**
 * Events price in USD, packages price in VND — there's no live FX in this
 * app, so this fixed rate is used only to combine both into one VND total
 * for the Billing page. It's an approximation, not a real exchange rate.
 */
export const USD_TO_VND_RATE = 25_000;

export interface BillingLine {
  name: string;
  date: string;
  amountVnd: number;
}

export interface BillingGroup {
  title: string;
  venue: string;
  lines: BillingLine[];
}

export interface BillingSummary {
  totalBookings: number;
  totalVnd: number;
}

export async function listBillingData(
  profileId: string,
  role: Role
): Promise<{ summary: BillingSummary; groups: BillingGroup[] }> {
  const supabase = await createClient();
  const groups: BillingGroup[] = [];

  if (role === "talent") {
    const { data: myPackages } = await supabase
      .from("packages")
      .select("id, title, location")
      .eq("talent_id", profileId);

    if (myPackages && myPackages.length > 0) {
      const packageById = new Map(myPackages.map((p) => [p.id, p]));
      const { data: bookings } = await supabase
        .from("package_bookings")
        .select("organizer_id, package_id, booked_date, price_vnd, created_at")
        .in("package_id", myPackages.map((p) => p.id))
        .in("status", ["confirmed", "completed"]);

      if (bookings && bookings.length > 0) {
        const organizerIds = [...new Set(bookings.map((b) => b.organizer_id))];
        const { data: organizers } = await supabase.from("profiles").select("id, full_name").in("id", organizerIds);
        const organizerNameById = new Map((organizers ?? []).map((p) => [p.id, p.full_name]));

        for (const booking of bookings) {
          const pkg = packageById.get(booking.package_id);
          if (!pkg) continue;
          let group = groups.find((g) => g.title === pkg.title);
          if (!group) {
            group = { title: pkg.title, venue: pkg.location, lines: [] };
            groups.push(group);
          }
          group.lines.push({
            name: organizerNameById.get(booking.organizer_id) ?? "Organizer",
            date: booking.booked_date ?? booking.created_at.slice(0, 10),
            amountVnd: booking.price_vnd,
          });
        }
      }
    }

    const { data: applications } = await supabase
      .from("event_applications")
      .select("slot_id, offer_amount_usd, created_at")
      .eq("applicant_profile_id", profileId)
      .in("status", ["accepted"]);

    if (applications && applications.length > 0) {
      const { data: slots } = await supabase
        .from("event_slots")
        .select("id, event_id, category_id, price_usd")
        .in("id", applications.map((a) => a.slot_id));

      if (slots && slots.length > 0) {
        const slotById = new Map(slots.map((s) => [s.id, s]));
        const { data: events } = await supabase
          .from("events")
          .select("id, name, venue, event_date")
          .in("id", slots.map((s) => s.event_id));
        const eventById = new Map((events ?? []).map((e) => [e.id, e]));
        const categoryNameById = await mapLookupNames(supabase, "categories", slots.map((s) => s.category_id));

        for (const app of applications) {
          const slot = slotById.get(app.slot_id);
          const event = slot ? eventById.get(slot.event_id) : undefined;
          if (!slot || !event) continue;
          let group = groups.find((g) => g.title === event.name);
          if (!group) {
            group = { title: event.name, venue: event.venue, lines: [] };
            groups.push(group);
          }
          const usd = app.offer_amount_usd ?? slot.price_usd;
          group.lines.push({
            name: categoryNameById.get(slot.category_id) ?? "",
            date: event.event_date,
            amountVnd: usd * USD_TO_VND_RATE,
          });
        }
      }
    }
  } else if (role === "organizer") {
    const { data: bookings } = await supabase
      .from("package_bookings")
      .select("package_id, booked_date, price_vnd, created_at")
      .eq("organizer_id", profileId)
      .in("status", ["confirmed", "completed"]);

    if (bookings && bookings.length > 0) {
      const { data: packages } = await supabase
        .from("packages")
        .select("id, title, location, talent_id")
        .in("id", bookings.map((b) => b.package_id));
      const packageById = new Map((packages ?? []).map((p) => [p.id, p]));

      const talentIds = [...new Set((packages ?? []).map((p) => p.talent_id))];
      const { data: talents } = await supabase.from("profiles").select("id, full_name").in("id", talentIds);
      const talentNameById = new Map((talents ?? []).map((p) => [p.id, p.full_name]));

      for (const booking of bookings) {
        const pkg = packageById.get(booking.package_id);
        if (!pkg) continue;
        let group = groups.find((g) => g.title === pkg.title);
        if (!group) {
          group = { title: pkg.title, venue: pkg.location, lines: [] };
          groups.push(group);
        }
        group.lines.push({
          name: talentNameById.get(pkg.talent_id) ?? "Talent",
          date: booking.booked_date ?? booking.created_at.slice(0, 10),
          amountVnd: booking.price_vnd,
        });
      }
    }

    const { data: myEvents } = await supabase
      .from("events")
      .select("id, name, venue, event_date")
      .eq("organizer_id", profileId);

    if (myEvents && myEvents.length > 0) {
      const eventById = new Map(myEvents.map((e) => [e.id, e]));
      const { data: slots } = await supabase
        .from("event_slots")
        .select("id, event_id, category_id, price_usd")
        .in("event_id", myEvents.map((e) => e.id));

      if (slots && slots.length > 0) {
        const slotById = new Map(slots.map((s) => [s.id, s]));
        const { data: applications } = await supabase
          .from("event_applications")
          .select("slot_id, applicant_profile_id, offer_amount_usd")
          .in("slot_id", slots.map((s) => s.id))
          .eq("status", "accepted");

        if (applications && applications.length > 0) {
          const applicantIds = [...new Set(applications.map((a) => a.applicant_profile_id))];
          const { data: applicants } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", applicantIds);
          const applicantNameById = new Map((applicants ?? []).map((p) => [p.id, p.full_name]));

          for (const app of applications) {
            const slot = slotById.get(app.slot_id);
            const event = slot ? eventById.get(slot.event_id) : undefined;
            if (!slot || !event) continue;
            let group = groups.find((g) => g.title === event.name);
            if (!group) {
              group = { title: event.name, venue: event.venue, lines: [] };
              groups.push(group);
            }
            const usd = app.offer_amount_usd ?? slot.price_usd;
            group.lines.push({
              name: applicantNameById.get(app.applicant_profile_id) ?? "Talent",
              date: event.event_date,
              amountVnd: usd * USD_TO_VND_RATE,
            });
          }
        }
      }
    }
  }

  const totalBookings = groups.reduce((sum, g) => sum + g.lines.length, 0);
  const totalVnd = groups.reduce((sum, g) => sum + g.lines.reduce((s, l) => s + l.amountVnd, 0), 0);

  return { summary: { totalBookings, totalVnd }, groups };
}
