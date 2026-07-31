import { createClient } from "@/lib/supabase/server";
import type {
  BookingWithNames,
  CartItemWithPackage,
  PackageRow,
  Profile,
} from "@/lib/supabase/types";

export async function getTalentBySlug(slug: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("slug", slug).eq("role", "talent").single();
  return data as Profile | null;
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
    .select("*, package:packages(id, title, location, talent_id)")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });
  if (!items || items.length === 0) return [];

  const talentIds = [...new Set(items.map((i) => (i.package as { talent_id: string }).talent_id))];
  const { data: talents } = await supabase.from("profiles").select("id, full_name").in("id", talentIds);
  const talentById = new Map((talents ?? []).map((t) => [t.id, t]));

  return items.map((item) => ({
    ...item,
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
