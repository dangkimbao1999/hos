import { AccountShell } from "@/components/account/account-shell";
import { PackagesContent } from "@/components/account/packages-content";
import { ACCOUNT_LIST_PAGE_SIZE, parsePageParam, totalPagesFor } from "@/lib/pagination";
import { listCategories, listCities } from "@/lib/supabase/lookups";
import { listPackagesWithBookingCountsPage } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [profile, categories, cities, params] = await Promise.all([
    getCurrentProfile(),
    listCategories(),
    listCities(),
    searchParams,
  ]);
  const page = parsePageParam(params.page);
  const { packages, totalCount } = profile
    ? await listPackagesWithBookingCountsPage(profile.id, page)
    : { packages: [], totalCount: 0 };

  return (
    <AccountShell role="talent">
      <PackagesContent
        role="talent"
        packages={packages}
        categories={categories}
        cities={cities}
        currentPage={page}
        totalPages={totalPagesFor(totalCount, ACCOUNT_LIST_PAGE_SIZE)}
      />
    </AccountShell>
  );
}
