"use server";

import { listScheduleEntries, type ScheduleEntry } from "@/lib/supabase/schedule";
import { getCurrentProfile } from "@/lib/supabase/server";

/**
 * A schedule is private, so this re-derives the signed-in user from the
 * session server-side — never trusts a client-passed profileId/role, unlike
 * the Discover actions (which fetch public data and can take the caller's
 * word for the filters).
 */
export async function fetchScheduleEntries(dateStart: string, dateEnd: string): Promise<ScheduleEntry[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];
  return listScheduleEntries(profile.id, profile.role, dateStart, dateEnd);
}
