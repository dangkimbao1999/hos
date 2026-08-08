import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";
import { monthFetchWindow, todayParts } from "@/lib/calendar";
import { listScheduleEntries } from "@/lib/supabase/schedule";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentSchedulePage() {
  const profile = await getCurrentProfile();
  const initialToday = todayParts();
  const { start, end } = monthFetchWindow(initialToday.year, initialToday.month);
  const entries = profile ? await listScheduleEntries(profile.id, "talent", start, end) : [];

  return (
    <AccountShell role="talent">
      <ScheduleContent initialEntries={entries} initialToday={initialToday} />
    </AccountShell>
  );
}
