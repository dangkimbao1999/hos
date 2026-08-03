"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function validateImage(file: FormDataEntryValue | null): { error: string } | { file: File } {
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { error: "Only PNG, JPEG, or WebP images are allowed." };
  if (file.size > MAX_FILE_BYTES) return { error: "Image must be under 5MB." };
  return { file };
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ error: string } | { success: true; url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const validated = validateImage(formData.get("avatar"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id)
    .select("role")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/${profile.role}`, "layout");
  return { success: true, url };
}

/** Uploads a KYC ID/selfie image to the private kyc-documents bucket. Returns the storage path (not a URL — the bucket isn't public). */
export async function uploadKycDocument(
  formData: FormData
): Promise<{ error: string } | { success: true; path: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const docType = String(formData.get("docType") ?? "");
  if (!docType) return { error: "Missing document type." };

  const validated = validateImage(formData.get("file"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${docType}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("kyc-documents")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  return { success: true, path };
}
