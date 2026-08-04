import { describe, expect, it } from "bun:test";
import { canAddGalleryImage, validateImage } from "@/lib/supabase/storage-validation";

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("validateImage", () => {
  it("rejects a missing file", () => {
    expect(validateImage(null)).toEqual({ error: "Choose an image to upload." });
  });

  it("rejects an unsupported type", () => {
    const result = validateImage(makeFile("a.gif", "image/gif", 100));
    expect("error" in result).toBe(true);
  });

  it("rejects a file over 5MB", () => {
    const result = validateImage(makeFile("a.png", "image/png", 6 * 1024 * 1024));
    expect("error" in result).toBe(true);
  });

  it("accepts a valid png under 5MB", () => {
    const result = validateImage(makeFile("a.png", "image/png", 1024));
    expect("file" in result).toBe(true);
  });
});

describe("canAddGalleryImage", () => {
  it("allows adding when under 5 images", () => {
    expect(canAddGalleryImage(["a", "b"])).toBe(true);
  });

  it("blocks adding at exactly 5 images", () => {
    expect(canAddGalleryImage(["a", "b", "c", "d", "e"])).toBe(false);
  });
});
