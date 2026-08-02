import { AccountShell } from "@/components/account/account-shell";
import { ScheduleContent } from "@/components/account/schedule-content";
import { listScheduleEntries } from "@/lib/supabase/schedule";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentSchedulePage() {
  const profile = await getCurrentProfile();
  const entries = profile ? await listScheduleEntries(profile.id, "talent") : [];

  return (
    <AccountShell role="talent">
      <ScheduleContent entries={entries} />
    </AccountShell>
  );
}
