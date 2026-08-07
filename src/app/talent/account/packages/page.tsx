import { AccountShell } from "@/components/account/account-shell";
import { PackagesContent } from "@/components/account/packages-content";
import { listCategories, listCities } from "@/lib/supabase/lookups";
import { listPackagesWithBookingCounts } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentPackagesPage() {
  const profile = await getCurrentProfile();
  const [packages, categories, cities] = await Promise.all([
    profile ? listPackagesWithBookingCounts(profile.id) : Promise.resolve([]),
    listCategories(),
    listCities(),
  ]);

  return (
    <AccountShell role="talent">
      <PackagesContent role="talent" packages={packages} categories={categories} cities={cities} />
    </AccountShell>
  );
}
