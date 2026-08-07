import { createClient } from "@/lib/supabase/server";
import type { CategoryOption, LookupOption } from "@/lib/supabase/types";

/** cities/genres/categories all share the (id, name) shape — resolve a batch of ids to their names for display. */
export async function mapLookupNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "cities" | "genres" | "categories",
  ids: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return new Map();
  const { data } = await supabase.from(table).select("id, name").in("id", uniqueIds);
  return new Map((data ?? []).map((row) => [row.id, row.name]));
}

export async function listCities(): Promise<LookupOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("cities").select("id, name").order("name");
  return data ?? [];
}

export async function listGenres(): Promise<LookupOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("genres").select("id, name").order("name");
  return data ?? [];
}

/** Top-level categories, each with its (possibly empty) subcategories nested inside. */
export async function listCategories(): Promise<CategoryOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, parent_id").order("name");
  const rows = data ?? [];
  return rows
    .filter((row) => row.parent_id === null)
    .map((top) => ({
      id: top.id,
      name: top.name,
      subcategories: rows
        .filter((row) => row.parent_id === top.id)
        .map((sub) => ({ id: sub.id, name: sub.name })),
    }));
}
