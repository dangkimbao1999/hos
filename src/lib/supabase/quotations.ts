import { mapLookupNames } from "@/lib/supabase/lookups";
import { ACCOUNT_LIST_PAGE_SIZE } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import type { QuotationWithNames } from "@/lib/supabase/types";

async function withNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Omit<QuotationWithNames, "organizer_name" | "talent_name" | "city_name">[]
): Promise<QuotationWithNames[]> {
  if (rows.length === 0) return [];
  const profileIds = [...new Set(rows.flatMap((r) => [r.organizer_id, r.talent_id]))];
  const [{ data: profiles }, cityNames] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", profileIds),
    mapLookupNames(supabase, "cities", rows.map((r) => r.city_id)),
  ]);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return rows.map((r) => ({
    ...r,
    organizer_name: nameById.get(r.organizer_id) ?? "Organizer",
    talent_name: nameById.get(r.talent_id) ?? "Talent",
    city_name: r.city_id ? (cityNames.get(r.city_id) ?? null) : null,
  }));
}

export async function listQuotationsForOrganizer(organizerId: string): Promise<QuotationWithNames[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotations")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });
  return withNames(supabase, data ?? []);
}

export async function listQuotationsForTalent(talentId: string): Promise<QuotationWithNames[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotations")
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });
  return withNames(supabase, data ?? []);
}

/** Offset-paginated variant of listQuotationsForOrganizer() — for Account > My Quotations. */
export async function listQuotationsForOrganizerPage(
  organizerId: string,
  page: number
): Promise<{ quotations: QuotationWithNames[]; totalCount: number }> {
  const supabase = await createClient();
  const offset = (page - 1) * ACCOUNT_LIST_PAGE_SIZE;
  const { data, count } = await supabase
    .from("quotations")
    .select("*", { count: "exact" })
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + ACCOUNT_LIST_PAGE_SIZE - 1);
  return { quotations: await withNames(supabase, data ?? []), totalCount: count ?? 0 };
}

/** Offset-paginated variant of listQuotationsForTalent() — for Account > My Quotations. */
export async function listQuotationsForTalentPage(
  talentId: string,
  page: number
): Promise<{ quotations: QuotationWithNames[]; totalCount: number }> {
  const supabase = await createClient();
  const offset = (page - 1) * ACCOUNT_LIST_PAGE_SIZE;
  const { data, count } = await supabase
    .from("quotations")
    .select("*", { count: "exact" })
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .range(offset, offset + ACCOUNT_LIST_PAGE_SIZE - 1);
  return { quotations: await withNames(supabase, data ?? []), totalCount: count ?? 0 };
}
