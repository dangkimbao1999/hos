/** Whether a booking's end time has passed, given its (local, no-timezone) date/time fields. */
export function hasEndTimePassed(
  bookedDate: string | null,
  bookedEndTime: string | null,
  now: Date = new Date()
): boolean {
  if (!bookedDate || !bookedEndTime) return false;
  const end = new Date(`${bookedDate}T${bookedEndTime}`);
  return now.getTime() >= end.getTime();
}
