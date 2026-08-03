import { createClient } from "@/lib/supabase/server";
import type { QuotationWithNames } from "@/lib/supabase/types";

async function withNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Omit<QuotationWithNames, "organizer_name" | "talent_name">[]
): Promise<QuotationWithNames[]> {
  if (rows.length === 0) return [];
  const profileIds = [...new Set(rows.flatMap((r) => [r.organizer_id, r.talent_id]))];
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", profileIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return rows.map((r) => ({
    ...r,
    organizer_name: nameById.get(r.organizer_id) ?? "Organizer",
    talent_name: nameById.get(r.talent_id) ?? "Talent",
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
