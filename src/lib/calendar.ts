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
