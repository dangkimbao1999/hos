/** "2026-08-28" -> "28/08/2026", matching the design's DAY pill format. */
export function formatEventDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** "21:30:00" -> "21:30" */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/** ("21:30:00", "23:00:00") -> "21:30 - 23:00" */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}
