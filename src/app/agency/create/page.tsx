import { EventHomeContent } from "@/components/shell/event-home-content";
import { AutoOpenCreatePackageDialog } from "@/components/create-package/auto-open-dialog";
import { listCategories, listCities } from "@/lib/supabase/lookups";

export default async function AgencyCreatePackagePage() {
  const [categories, cities] = await Promise.all([listCategories(), listCities()]);
  return (
    <>
      <EventHomeContent role="agency" />
      <AutoOpenCreatePackageDialog role="agency" categories={categories} cities={cities} />
    </>
  );
}
