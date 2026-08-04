const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateImage(file: FormDataEntryValue | null): { error: string } | { file: File } {
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { error: "Only PNG, JPEG, or WebP images are allowed." };
  if (file.size > MAX_FILE_BYTES) return { error: "Image must be under 5MB." };
  return { file };
}

export function canAddGalleryImage(current: string[]): boolean {
  return current.length < 5;
}
