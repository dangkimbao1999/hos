import { Suspense } from "react";
import { DiscoverContent } from "@/components/shell/discover-content";
import { PRICE_FILTER_MAX } from "@/components/shell/price-range-filter";
import { listCategories, listCities } from "@/lib/supabase/lookups";
import { DISCOVER_PAGE_SIZE, listDiscoverHashtagSuggestions, searchDiscoverPackages } from "@/lib/supabase/packages";
import type { CategoryOption, DiscoverFilters } from "@/lib/supabase/types";

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

/** Resolves the sidebar/search URL params (?category=, ?subcategory=, ?q=) into the RPC's filter shape, matching DiscoverContent's own client-side defaults. */
function resolveInitialFilters(
  categories: CategoryOption[],
  params: { category?: string | string[]; subcategory?: string | string[]; q?: string | string[] }
): DiscoverFilters {
  const search = firstParam(params.q);
  const categoryName = firstParam(params.category) ?? categories[0]?.name ?? null;
  const category = categories.find((c) => c.name === categoryName) ?? null;
  const subcategoryName = firstParam(params.subcategory);
  const subcategory = subcategoryName ? (category?.subcategories.find((s) => s.name === subcategoryName) ?? null) : null;

  return {
    categoryId: category?.id ?? null,
    subcategoryId: subcategory?.id ?? null,
    cityId: null,
    priceMin: 0,
    priceMax: PRICE_FILTER_MAX,
    hashtags: [],
    dateStart: null,
    dateEnd: null,
    search,
    sort: "newest",
  };
}

export default async function OrganizerDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [categories, cities, hashtagSuggestions, params] = await Promise.all([
    listCategories(),
    listCities(),
    listDiscoverHashtagSuggestions(),
    searchParams,
  ]);
  const filters = resolveInitialFilters(categories, params);
  const packages = await searchDiscoverPackages(filters, null, DISCOVER_PAGE_SIZE);

  return (
    <Suspense>
      <DiscoverContent
        role="organizer"
        categories={categories}
        cities={cities}
        hashtagSuggestions={hashtagSuggestions}
        initialPackages={packages}
        initialHasMore={packages.length === DISCOVER_PAGE_SIZE}
      />
    </Suspense>
  );
}
