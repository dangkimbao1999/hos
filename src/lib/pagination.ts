export const ACCOUNT_LIST_PAGE_SIZE = 10;

export function totalPagesFor(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

/** Parses a `?page=` search param into a 1-indexed page number, defaulting to 1 for anything invalid. */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Math.floor(Number(raw));
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * Windowed page-number list for a numbered pagination control: every page when
 * there are few, otherwise first/last plus a window around the current page,
 * with "ellipsis" markers for the gaps.
 */
export function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const WINDOW = 1;
  if (totalPages <= 5 + WINDOW * 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (let p = currentPage - WINDOW; p <= currentPage + WINDOW; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) result.push("ellipsis");
    result.push(sorted[i]!);
  }
  return result;
}
