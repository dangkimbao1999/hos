export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offsetFromMonday = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offsetFromMonday);
  return copy;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function getMonthGrid(year: number, month: number): { leadingBlanks: number; days: number[] } {
  const firstOfMonth = new Date(year, month, 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { leadingBlanks, days: Array.from({ length: daysInMonth }, (_, i) => i + 1) };
}

/** Today's local year/month/day, as plain numbers — safe to pass across a server/client boundary without timezone-shift risk (unlike an ISO string re-parsed via `new Date(str)`, which reads as UTC midnight). */
export function todayParts(): { year: number; month: number; day: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/**
 * The date range to fetch schedule entries for when browsing a given month:
 * the month itself, padded 6 days on each side — the most a Mon-Sun week can
 * spill across a month boundary — so every week selectable from that month's
 * mini-calendar is fully covered by one fetch.
 */
export function monthFetchWindow(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1 - 6);
  const end = new Date(year, month + 1, 0 + 6);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}
