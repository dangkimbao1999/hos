"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryTabs } from "@/components/shell/category-tabs";
import { FilterPill } from "@/components/shell/filter-pill";
import { HashtagFilter } from "@/components/shell/hashtag-filter";
import { PriceRangeFilter } from "@/components/shell/price-range-filter";
import { TimeRangeFilter } from "@/components/shell/time-range-filter";
import { SearchResultCard } from "@/components/shell/listing-card";
import { talentCategories, type Role } from "@/lib/nav-items";
import { mockSearchResults } from "@/lib/mock-listings";
import { mockTalentDetail } from "@/lib/mock-talent-detail";

const categoryLabels = talentCategories.map((c) => c.label);

const copy: Record<Role, { keyword: string }> = {
  organizer: { keyword: "MCK" },
  talent: { keyword: "Music Festival" },
  agency: { keyword: "Music Festival" },
};

export function DiscoverContent({ role }: { role: Role }) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl ?? categoryLabels[0]);
  const { keyword } = copy[role];

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
          We found {String(mockSearchResults.length).padStart(2, "0")} result
          {mockSearchResults.length === 1 ? "" : "s"} for &ldquo;{keyword}&rdquo; keyword
        </h1>
        <p className="text-sm text-muted-foreground">Use filter for better search experience</p>
      </div>

      <CategoryTabs categories={categoryLabels} active={activeCategory} onChange={setActiveCategory} />

      <div className="scrollbar-hide flex gap-3 overflow-x-auto">
        <FilterPill label="Sort by" defaultValue="Most Popular" options={["Most Popular", "Newest", "Price: Low to High", "Price: High to Low"]} />
        <FilterPill label="Sub-Category" defaultValue="All" options={["All", "Rapper", "Ballad", "RnB", "Bolero"]} />
        <FilterPill label="Location" defaultValue="HCM City" options={["HCM City", "Hanoi", "Da Nang"]} />
        <PriceRangeFilter />
        <TimeRangeFilter />
        <HashtagFilter />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,289px)] gap-6 pt-4">
        {mockSearchResults.map((item) => (
          <SearchResultCard key={item.id} data={item} href={`/organizer/talents/${mockTalentDetail.slug}`} />
        ))}
      </div>
    </div>
  );
}
