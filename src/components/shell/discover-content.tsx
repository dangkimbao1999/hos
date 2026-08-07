"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryTabs } from "@/components/shell/category-tabs";
import { FilterPill } from "@/components/shell/filter-pill";
import { HashtagFilter } from "@/components/shell/hashtag-filter";
import { PriceRangeFilter, PRICE_FILTER_MAX } from "@/components/shell/price-range-filter";
import { TimeRangeFilter, type DateRange } from "@/components/shell/time-range-filter";
import { SearchResultCard } from "@/components/shell/listing-card";
import type { Role } from "@/lib/nav-items";
import type { CategoryOption, LookupOption, PackageWithTalent } from "@/lib/supabase/types";

const SORTS = ["Most Popular", "Newest", "Price: Low to High", "Price: High to Low"];

export function toCardData(pkg: PackageWithTalent) {
  return {
    id: pkg.id,
    title: pkg.talent_name,
    category: pkg.subcategory_name ? `${pkg.category_name} · ${pkg.subcategory_name}` : pkg.category_name,
    avatarUrl: pkg.talent_avatar_url,
    priceMin: pkg.price_min_vnd,
    priceMax: pkg.price_max_vnd,
    currency: "VND" as const,
  };
}

export function DiscoverContent({
  role,
  packages,
  categories,
  cities,
}: {
  role: Role;
  packages: PackageWithTalent[];
  categories: CategoryOption[];
  cities: LookupOption[];
}) {
  const searchParams = useSearchParams();
  const categoryLabels = categories.map((c) => c.name);
  const categoryFromUrl = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl ?? categoryLabels[0]);
  const [subCategory, setSubCategory] = useState("All");
  const [location, setLocation] = useState("All");
  const [sort, setSort] = useState(SORTS[0]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_FILTER_MAX]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  const LOCATIONS = ["All", ...cities.map((c) => c.name)];
  const subCategoryOptions = [
    "All",
    ...(categories.find((c) => c.name === activeCategory)?.subcategories.map((s) => s.name) ?? []),
  ];

  const hashtagSuggestions = [...new Set(packages.flatMap((p) => p.talent_keywords))];

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setSubCategory("All");
  }

  const results = useMemo(() => {
    return packages
      .filter((pkg) => {
        if (pkg.category_name !== activeCategory) return false;
        if (subCategory !== "All" && pkg.subcategory_name !== subCategory) return false;
        if (location !== "All" && pkg.city_name !== location) return false;
        if (pkg.price_max_vnd < priceRange[0] || pkg.price_min_vnd > priceRange[1]) return false;
        if (hashtags.length > 0 && !hashtags.some((h) => pkg.talent_keywords.includes(h))) return false;
        if (dateRange.start && dateRange.end && (pkg.end_date < dateRange.start || pkg.start_date > dateRange.end))
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "Price: Low to High") return a.price_min_vnd - b.price_min_vnd;
        if (sort === "Price: High to Low") return b.price_min_vnd - a.price_min_vnd;
        // "Most Popular" has no real signal to sort by (no ratings/booking-count data yet) — falls back to Newest.
        return b.created_at.localeCompare(a.created_at);
      });
  }, [packages, activeCategory, subCategory, location, priceRange, sort, hashtags, dateRange]);

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
          We found {String(results.length).padStart(2, "0")} result{results.length === 1 ? "" : "s"} matching
          your filters
        </h1>
        <p className="text-sm text-muted-foreground">Use filter for better search experience</p>
      </div>

      <CategoryTabs categories={categoryLabels} active={activeCategory} onChange={handleCategoryChange} />

      <div className="scrollbar-hide flex gap-3 overflow-x-auto">
        <FilterPill label="Sort by" options={SORTS} value={sort} onChange={setSort} />
        <FilterPill label="Sub-Category" options={subCategoryOptions} value={subCategory} onChange={setSubCategory} />
        <FilterPill label="Location" options={LOCATIONS} value={location} onChange={setLocation} />
        <PriceRangeFilter range={priceRange} onChange={setPriceRange} />
        <TimeRangeFilter range={dateRange} onChange={setDateRange} />
        <HashtagFilter selected={hashtags} onChange={setHashtags} suggestions={hashtagSuggestions} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,289px)] gap-6 pt-4">
        {results.map((pkg) => (
          <SearchResultCard key={pkg.id} data={toCardData(pkg)} href={`/${role}/talents/${pkg.talent_slug}`} />
        ))}
      </div>
    </div>
  );
}
