import { Suspense } from "react";
import { DiscoverContent } from "@/components/shell/discover-content";
import { listCategories, listCities } from "@/lib/supabase/lookups";
import { listDiscoverPackages } from "@/lib/supabase/packages";

export default async function OrganizerDiscoverPage() {
  const [packages, categories, cities] = await Promise.all([
    listDiscoverPackages(),
    listCategories(),
    listCities(),
  ]);
  return (
    <Suspense>
      <DiscoverContent role="organizer" packages={packages} categories={categories} cities={cities} />
    </Suspense>
  );
}

