import { mapLookupNames } from "@/lib/supabase/lookups";
import { createClient } from "@/lib/supabase/server";
import type {
  BookingWithNames,
  CartItemWithPackage,
  PackageRow,
  PackageWithLookupNames,
  PackageWithTalent,
  ProfileWithLookupNames,
} from "@/lib/supabase/types";

export async function getTalentBySlug(slug: string): Promise<ProfileWithLookupNames | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("slug", slug).eq("role", "talent").single();
  if (!data) return null;

  const [cityNames, genreNames, categoryNames] = await Promise.all([
    mapLookupNames(supabase, "cities", [data.city_id]),
    mapLookupNames(supabase, "genres", [data.genre_id]),
    mapLookupNames(supabase, "categories", [data.category_id, data.subcategory_id]),
  ]);

  return {
    ...data,
    city_name: cityNames.get(data.city_id) ?? null,
    genre_name: genreNames.get(data.genre_id) ?? null,
    category_name: categoryNames.get(data.category_id) ?? null,
    subcategory_name: categoryNames.get(data.subcategory_id) ?? null,
  };
}

export async function withTalentInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  packages: PackageRow[]
): Promise<PackageWithTalent[]> {
  if (packages.length === 0) return [];

  const talentIds = [...new Set(packages.map((p) => p.talent_id))];
  const { data: talents } = await supabase
    .from("profiles")
    .select("id, full_name, slug, keywords, avatar_url, genre_id")
    .in("id", talentIds);
  const talentById = new Map((talents ?? []).map((t) => [t.id, t]));

  const [cityNames, categoryNames, genreNames] = await Promise.all([
    mapLookupNames(supabase, "cities", packages.map((p) => p.city_id)),
    mapLookupNames(
      supabase,
      "categories",
      packages.flatMap((p) => [p.category_id, p.subcategory_id])
    ),
    mapLookupNames(supabase, "genres", (talents ?? []).map((t) => t.genre_id)),
  ]);

  return packages.flatMap((pkg) => {
    const talent = talentById.get(pkg.talent_id);
    if (!talent) return [];
    return [
      {
        ...pkg,
        talent_name: talent.full_name,
        talent_slug: talent.slug,
        talent_keywords: talent.keywords,
        talent_avatar_url: talent.avatar_url,
        talent_genre_name: talent.genre_id ? (genreNames.get(talent.genre_id) ?? null) : null,
        category_name: categoryNames.get(pkg.category_id) ?? "",
        subcategory_name: pkg.subcategory_id ? (categoryNames.get(pkg.subcategory_id) ?? null) : null,
        city_name: cityNames.get(pkg.city_id) ?? "",
      },
    ];
  });
}

/** Every active package with its talent's name/slug — for the organizer Discover grid. */
export async function listDiscoverPackages(): Promise<PackageWithTalent[]> {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return withTalentInfo(supabase, packages ?? []);
}

/** Admin-curated (is_most_popular = true, set directly in the DB — no admin portal yet) — for the organizer Home page. */
export async function listMostPopularPackages(limit: number): Promise<PackageWithTalent[]> {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("status", "active")
    .eq("is_most_popular", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return withTalentInfo(supabase, packages ?? []);
}

/** Admin-curated (is_editor_choice = true, set directly in the DB — no admin portal yet) — for the organizer Home page. */
export async function listEditorChoicePackages(limit: number): Promise<PackageWithTalent[]> {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("status", "active")
    .eq("is_editor_choice", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return withTalentInfo(supabase, packages ?? []);
}

/** Newest active packages — for the organizer Home page's "Recently Added" section. */
export async function listRecentPackages(limit: number): Promise<PackageWithTalent[]> {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  return withTalentInfo(supabase, packages ?? []);
}

export async function listPackagesForTalent(talentId: string): Promise<PackageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** A talent's own packages with city/category/subcategory ids resolved to display names — for the public Talent detail page. */
export async function listPackagesForTalentWithNames(talentId: string): Promise<PackageWithLookupNames[]> {
  const supabase = await createClient();
  const packages = await listPackagesForTalent(talentId);
  if (packages.length === 0) return [];

  const [cityNames, categoryNames] = await Promise.all([
    mapLookupNames(supabase, "cities", packages.map((p) => p.city_id)),
    mapLookupNames(
      supabase,
      "categories",
      packages.flatMap((p) => [p.category_id, p.subcategory_id])
    ),
  ]);

  return packages.map((pkg) => ({
    ...pkg,
    category_name: categoryNames.get(pkg.category_id) ?? "",
    subcategory_name: pkg.subcategory_id ? (categoryNames.get(pkg.subcategory_id) ?? null) : null,
    city_name: cityNames.get(pkg.city_id) ?? "",
  }));
}

/** Whether a candidate package should surface in another talent's "related" carousel. */
export function isRelatedPackage(
  pkg: Pick<PackageWithTalent, "category_name" | "talent_genre_name">,
  categoryNames: string[],
  genreName: string | null
): boolean {
  return categoryNames.includes(pkg.category_name) || (genreName !== null && pkg.talent_genre_name === genreName);
}

/** Active packages from other talents whose category or genre matches this talent's — for the talent-detail page's "More Related Talents" carousel. */
export async function listRelatedPackagesForTalent(
  talentId: string,
  categoryNames: string[],
  genreName: string | null,
  limit: number
): Promise<PackageWithTalent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("status", "active")
    .neq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .limit(100);

  const candidates = await withTalentInfo(supabase, data ?? []);
  const related = candidates.filter((pkg) => isRelatedPackage(pkg, categoryNames, genreName));
  return related.slice(0, limit);
}

/** A talent's own packages, plus how many bookings each has — for Account > My Packages. */
export async function listPackagesWithBookingCounts(
  talentId: string
): Promise<(PackageRow & { bookingCount: number })[]> {
  const supabase = await createClient();
  const packages = await listPackagesForTalent(talentId);
  if (packages.length === 0) return [];

  const { data: bookings } = await supabase
    .from("package_bookings")
    .select("package_id")
    .in("package_id", packages.map((p) => p.id));

  const countByPackageId = new Map<string, number>();
  for (const booking of bookings ?? []) {
    countByPackageId.set(booking.package_id, (countByPackageId.get(booking.package_id) ?? 0) + 1);
  }

  return packages.map((pkg) => ({ ...pkg, bookingCount: countByPackageId.get(pkg.id) ?? 0 }));
}

export async function listCartItems(organizerId: string): Promise<CartItemWithPackage[]> {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("cart_items")
    .select("*, package:packages(id, title, city_id, talent_id)")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });
  if (!items || items.length === 0) return [];

  const talentIds = [...new Set(items.map((i) => (i.package as { talent_id: string }).talent_id))];
  const { data: talents } = await supabase.from("profiles").select("id, full_name").in("id", talentIds);
  const talentById = new Map((talents ?? []).map((t) => [t.id, t]));

  const cityNames = await mapLookupNames(
    supabase,
    "cities",
    items.map((i) => (i.package as { city_id: string }).city_id)
  );

  return items.map((item) => ({
    ...item,
    package: {
      ...(item.package as { id: string; title: string; city_id: string }),
      city_name: cityNames.get((item.package as { city_id: string }).city_id) ?? "",
    },
    talent: talentById.get((item.package as { talent_id: string }).talent_id) ?? { id: "", full_name: "" },
  })) as CartItemWithPackage[];
}

async function attachNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookings: { package_id: string; organizer_id: string }[]
) {
  if (bookings.length === 0) return { packageById: new Map(), profileById: new Map() };

  const packageIds = [...new Set(bookings.map((b) => b.package_id))];
  const { data: packages } = await supabase.from("packages").select("id, title, talent_id").in("id", packageIds);
  const packageById = new Map((packages ?? []).map((p) => [p.id, p]));

  const talentIds = (packages ?? []).map((p) => p.talent_id);
  const organizerIds = bookings.map((b) => b.organizer_id);
  const profileIds = [...new Set([...talentIds, ...organizerIds])];
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", profileIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return { packageById, profileById };
}

export async function listBookingsForOrganizer(organizerId: string): Promise<BookingWithNames[]> {
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("package_bookings")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });
  if (!bookings) return [];

  const { packageById, profileById } = await attachNames(supabase, bookings);
  return bookings.map((b) => {
    const pkg = packageById.get(b.package_id);
    return {
      ...b,
      package_title: pkg?.title ?? "",
      talent_name: (pkg && profileById.get(pkg.talent_id)?.full_name) || "",
      organizer_name: profileById.get(b.organizer_id)?.full_name ?? "",
    };
  });
}

export async function listBookingsForTalent(talentId: string): Promise<BookingWithNames[]> {
  const supabase = await createClient();
  const { data: myPackages } = await supabase.from("packages").select("id").eq("talent_id", talentId);
  const packageIds = (myPackages ?? []).map((p) => p.id);
  if (packageIds.length === 0) return [];

  const { data: bookings } = await supabase
    .from("package_bookings")
    .select("*")
    .in("package_id", packageIds)
    .order("created_at", { ascending: false });
  if (!bookings) return [];

  const { packageById, profileById } = await attachNames(supabase, bookings);
  return bookings.map((b) => {
    const pkg = packageById.get(b.package_id);
    return {
      ...b,
      package_title: pkg?.title ?? "",
      talent_name: (pkg && profileById.get(pkg.talent_id)?.full_name) || "",
      organizer_name: profileById.get(b.organizer_id)?.full_name ?? "",
    };
  });
}
