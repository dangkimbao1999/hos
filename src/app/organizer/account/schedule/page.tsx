import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";
import { listScheduleEntries } from "@/lib/supabase/schedule";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerSchedulePage() {
  const profile = await getCurrentProfile();
  const entries = profile ? await listScheduleEntries(profile.id, "organizer") : [];

  return (
    <AccountShell role="organizer">
      <ScheduleContent entries={entries} />
    </AccountShell>
  );
}
