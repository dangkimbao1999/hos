import { AccountShell } from "@/components/account/account-shell";
import { ProfileContent } from "@/components/account/profile-content";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function AgencyProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <AccountShell role="agency">
      <ProfileContent role="agency" profile={profile!} />
    </AccountShell>
  );
}
