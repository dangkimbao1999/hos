import { AccountShell } from "@/components/account/account-shell";
import { PackagesContent } from "@/components/account/packages-content";
import { listCategories, listCities } from "@/lib/supabase/lookups";

export default async function AgencyPackagesPage() {
  const [categories, cities] = await Promise.all([listCategories(), listCities()]);
  return (
    <AccountShell role="agency">
      <PackagesContent role="agency" categories={categories} cities={cities} />
    </AccountShell>
  );
}

