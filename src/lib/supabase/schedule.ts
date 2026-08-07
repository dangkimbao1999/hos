import { createClient } from "@/lib/supabase/server";
import { mapLookupNames } from "@/lib/supabase/lookups";
import type { Role } from "@/lib/nav-items";

export interface ScheduleEntry {
  title: string;
  venue: string;
  date: string;
  startHour: number;
  endHour: number;
}

function timeToHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

/** Confirmed engagements (accepted event applications + confirmed package bookings) for the Schedule page. */
export async function listScheduleEntries(profileId: string, role: Role): Promise<ScheduleEntry[]> {
  const supabase = await createClient();
  const entries: ScheduleEntry[] = [];

  if (role === "organizer") {
    const { data: myEvents } = await supabase
      .from("events")
      .select("id, name, venue, event_date, start_time, end_time")
      .eq("organizer_id", profileId);

    if (myEvents && myEvents.length > 0) {
      const eventById = new Map(myEvents.map((e) => [e.id, e]));
      const { data: slots } = await supabase
        .from("event_slots")
        .select("id, event_id, category_id")
        .in("event_id", myEvents.map((e) => e.id));
      const slotById = new Map((slots ?? []).map((s) => [s.id, s]));

      if (slots && slots.length > 0) {
        const { data: applications } = await supabase
          .from("event_applications")
          .select("applicant_profile_id, slot_id")
          .in("slot_id", slots.map((s) => s.id))
          .eq("status", "accepted");

        if (applications && applications.length > 0) {
          const applicantIds = [...new Set(applications.map((a) => a.applicant_profile_id))];
          const { data: applicants } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", applicantIds);
          const applicantNameById = new Map((applicants ?? []).map((p) => [p.id, p.full_name]));
          const categoryNameById = await mapLookupNames(supabase, "categories", slots.map((s) => s.category_id));

          for (const app of applications) {
            const slot = slotById.get(app.slot_id);
            const event = slot ? eventById.get(slot.event_id) : undefined;
            if (!slot || !event) continue;
            const categoryName = categoryNameById.get(slot.category_id) ?? "";
            entries.push({
              title: `${applicantNameById.get(app.applicant_profile_id) ?? "Talent"} — ${categoryName}`,
              venue: event.venue,
              date: event.event_date,
              startHour: timeToHour(event.start_time),
              endHour: timeToHour(event.end_time),
            });
          }
        }
      }
    }

    const { data: bookings } = await supabase
      .from("package_bookings")
      .select("package_id, booked_date, booked_time")
      .eq("organizer_id", profileId)
      .eq("status", "confirmed");

    if (bookings && bookings.length > 0) {
      const { data: packages } = await supabase
        .from("packages")
        .select("id, title, location, start_date, start_time, end_time")
        .in("id", bookings.map((b) => b.package_id));
      const packageById = new Map((packages ?? []).map((p) => [p.id, p]));

      for (const booking of bookings) {
        const pkg = packageById.get(booking.package_id);
        if (!pkg) continue;
        entries.push({
          title: pkg.title,
          venue: pkg.location,
          date: booking.booked_date ?? pkg.start_date,
          startHour: timeToHour(booking.booked_time ?? pkg.start_time),
          endHour: timeToHour(pkg.end_time),
        });
      }
    }
  } else {
    const { data: applications } = await supabase
      .from("event_applications")
      .select("slot_id")
      .eq("applicant_profile_id", profileId)
      .eq("status", "accepted");

    if (applications && applications.length > 0) {
      const { data: slots } = await supabase
        .from("event_slots")
        .select("id, event_id, category_id")
        .in("id", applications.map((a) => a.slot_id));

      if (slots && slots.length > 0) {
        const { data: events } = await supabase
          .from("events")
          .select("id, name, venue, event_date, start_time, end_time")
          .in("id", slots.map((s) => s.event_id));
        const eventById = new Map((events ?? []).map((e) => [e.id, e]));
        const categoryNameById = await mapLookupNames(supabase, "categories", slots.map((s) => s.category_id));

        for (const slot of slots) {
          const event = eventById.get(slot.event_id);
          if (!event) continue;
          const categoryName = categoryNameById.get(slot.category_id) ?? "";
          entries.push({
            title: `${event.name} — ${categoryName}`,
            venue: event.venue,
            date: event.event_date,
            startHour: timeToHour(event.start_time),
            endHour: timeToHour(event.end_time),
          });
        }
      }
    }

    const { data: myPackages } = await supabase.from("packages").select("id").eq("talent_id", profileId);
    if (myPackages && myPackages.length > 0) {
      const { data: bookings } = await supabase
        .from("package_bookings")
        .select("organizer_id, package_id, booked_date, booked_time")
        .in("package_id", myPackages.map((p) => p.id))
        .eq("status", "confirmed");

      if (bookings && bookings.length > 0) {
        const { data: packages } = await supabase
          .from("packages")
          .select("id, title, location, start_date, start_time, end_time")
          .in("id", bookings.map((b) => b.package_id));
        const packageById = new Map((packages ?? []).map((p) => [p.id, p]));

        const organizerIds = [...new Set(bookings.map((b) => b.organizer_id))];
        const { data: organizers } = await supabase.from("profiles").select("id, full_name").in("id", organizerIds);
        const organizerNameById = new Map((organizers ?? []).map((p) => [p.id, p.full_name]));

        for (const booking of bookings) {
          const pkg = packageById.get(booking.package_id);
          if (!pkg) continue;
          entries.push({
            title: `${organizerNameById.get(booking.organizer_id) ?? "Organizer"} — ${pkg.title}`,
            venue: pkg.location,
            date: booking.booked_date ?? pkg.start_date,
            startHour: timeToHour(booking.booked_time ?? pkg.start_time),
            endHour: timeToHour(pkg.end_time),
          });
        }
      }
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour);
}
