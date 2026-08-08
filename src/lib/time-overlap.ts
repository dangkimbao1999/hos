/** Half-open interval overlap ("HH:MM" or "HH:MM:SS" strings compare correctly as-is). */
export function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}
