import { AccountShell } from "@/components/account/account-shell";
import { PackagesContent } from "@/components/account/packages-content";
import { listPackagesWithBookingCounts } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentPackagesPage() {
  const profile = await getCurrentProfile();
  const packages = profile ? await listPackagesWithBookingCounts(profile.id) : [];

  return (
    <AccountShell role="talent">
      <PackagesContent role="talent" packages={packages} />
    </AccountShell>
  );
}
