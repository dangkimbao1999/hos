import { AccountShell } from "@/components/account/account-shell";
import { ProfileContent } from "@/components/account/profile-content";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <AccountShell role="talent">
      <ProfileContent role="talent" profile={profile!} />
    </AccountShell>
  );
}
