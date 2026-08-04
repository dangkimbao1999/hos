import type { Achievement, SocialLink } from "@/lib/supabase/types";

function parseJsonArray(raw: FormDataEntryValue): unknown[] | null {
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseSocialLinks(raw: FormDataEntryValue): SocialLink[] | null {
  const rows = parseJsonArray(raw);
  if (rows === null) return null;
  return rows
    .map((row) => {
      const r = row as { platform?: unknown; url?: unknown };
      return { platform: String(r?.platform ?? "").trim(), url: String(r?.url ?? "").trim() };
    })
    .filter((row) => row.platform && row.url);
}

export function parseAchievements(raw: FormDataEntryValue): Achievement[] | null {
  const rows = parseJsonArray(raw);
  if (rows === null) return null;
  return rows
    .map((row) => {
      const r = row as { title?: unknown; subtitle?: unknown };
      return { title: String(r?.title ?? "").trim(), subtitle: String(r?.subtitle ?? "").trim() };
    })
    .filter((row) => row.title);
}

export function parseServices(raw: FormDataEntryValue): string[] | null {
  const rows = parseJsonArray(raw);
  if (rows === null) return null;
  return rows.map((v) => String(v).trim()).filter(Boolean);
}
