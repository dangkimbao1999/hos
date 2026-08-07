export const MAX_EVENT_PHOTOS = 10;

export function parseEventPhotoPaths(
  value: FormDataEntryValue | null,
  userId: string
): { paths: string[] } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(value ?? "[]"));
  } catch {
    return { error: "Invalid event photos." };
  }

  if (!Array.isArray(parsed) || parsed.some((path) => typeof path !== "string")) {
    return { error: "Invalid event photos." };
  }
  if (parsed.length > MAX_EVENT_PHOTOS) {
    return { error: `You can upload at most ${MAX_EVENT_PHOTOS} event photos.` };
  }

  const prefix = `${userId}/events/`;
  if (
    parsed.some((path) => {
      const filename = path.slice(prefix.length);
      return !path.startsWith(prefix) || !/^[0-9a-f-]+\.(?:png|jpg|webp)$/i.test(filename);
    })
  ) {
    return { error: "Invalid event photos." };
  }

  return { paths: [...new Set(parsed)] };
}
