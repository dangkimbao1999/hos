import { EventHomeContent } from "@/components/shell/event-home-content";
import { AutoOpenCreatePackageDialog } from "@/components/create-package/auto-open-dialog";
import { listCategories, listCities } from "@/lib/supabase/lookups";

export default async function TalentCreatePackagePage() {
  const [categories, cities] = await Promise.all([listCategories(), listCities()]);
  return (
    <>
      <EventHomeContent role="talent" />
      <AutoOpenCreatePackageDialog role="talent" categories={categories} cities={cities} />
    </>
  );
}
