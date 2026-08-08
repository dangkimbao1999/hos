import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";
import { monthFetchWindow, todayParts } from "@/lib/calendar";
import { listScheduleEntries } from "@/lib/supabase/schedule";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerSchedulePage() {
  const profile = await getCurrentProfile();
  const initialToday = todayParts();
  const { start, end } = monthFetchWindow(initialToday.year, initialToday.month);
  const entries = profile ? await listScheduleEntries(profile.id, "organizer", start, end) : [];

  return (
    <AccountShell role="organizer">
      <ScheduleContent initialEntries={entries} initialToday={initialToday} />
    </AccountShell>
  );
}
