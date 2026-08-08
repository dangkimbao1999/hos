"use server";

import { DISCOVER_PAGE_SIZE, searchDiscoverPackages } from "@/lib/supabase/packages";
import type { DiscoverCursor, DiscoverFilters, PackageWithTalent } from "@/lib/supabase/types";

/** One page of the organizer Discover grid — call again with the returned cursor to load 15 more. */
export async function fetchDiscoverPackages(
  filters: DiscoverFilters,
  cursor: DiscoverCursor | null
): Promise<{ packages: PackageWithTalent[]; hasMore: boolean }> {
  const packages = await searchDiscoverPackages(filters, cursor, DISCOVER_PAGE_SIZE);
  return { packages, hasMore: packages.length === DISCOVER_PAGE_SIZE };
}
