import { createClient } from "@/lib/supabase/server";
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

/**
 * Confirmed engagements (accepted event applications + confirmed package
 * bookings) whose date falls within [dateStart, dateEnd] — for the Schedule
 * page. Date-windowed, not count-paginated: a personal schedule's row count
 * within any given window is inherently small (bounded by reality, not by
 * data volume), so the date range itself is the bound — no LIMIT/COUNT
 * needed. The caller sizes the window for what it's displaying.
 */
export async function listScheduleEntries(
  profileId: string,
  role: Role,
  dateStart: string,
  dateEnd: string
): Promise<ScheduleEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_schedule_entries", {
    p_profile_id: profileId,
    p_role: role,
    p_date_start: dateStart,
    p_date_end: dateEnd,
  });
  return (data ?? []).map(
    (row: { title: string; venue: string; date: string; start_time: string; end_time: string }) => ({
      title: row.title,
      venue: row.venue,
      date: row.date,
      startHour: timeToHour(row.start_time),
      endHour: timeToHour(row.end_time),
    })
  );
}
