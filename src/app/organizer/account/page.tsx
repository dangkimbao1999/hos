import { AccountShell } from "@/components/account/account-shell";
import { ProfileContent } from "@/components/account/profile-content";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <AccountShell role="organizer">
      <ProfileContent role="organizer" profile={profile!} />
    </AccountShell>
  );
}
