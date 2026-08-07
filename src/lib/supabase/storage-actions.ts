"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";
import { canAddGalleryImage, validateImage } from "@/lib/supabase/storage-validation";

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

/** Cover photo upload — Talent only in the UI, but not role-restricted server-side beyond the KYC gate every mutating action already requires. */
export async function uploadCover(
  formData: FormData
): Promise<{ error: string } | { success: true; url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const validated = validateImage(formData.get("cover"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/cover.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-media")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-media").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ cover_url: url })
    .eq("id", user.id)
    .select("role")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/${profile.role}`, "layout");
  return { success: true, url };
}

export async function uploadGalleryImage(
  formData: FormData
): Promise<{ error: string } | { success: true; url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("gallery_urls")
    .eq("id", user.id)
    .single();
  if (existingError) return { error: existingError.message };
  const current = existing?.gallery_urls ?? [];
  if (!canAddGalleryImage(current)) return { error: "You can upload at most 5 thumbnail images." };

  const validated = validateImage(formData.get("image"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/gallery/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-media")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-media").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;
  const nextGallery = [...current, url];

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ gallery_urls: nextGallery })
    .eq("id", user.id)
    .select("role")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/${updated.role}`, "layout");
  return { success: true, url };
}

export async function removeGalleryImage(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const url = String(formData.get("url") ?? "");
  if (!url) return { error: "Missing image to remove." };

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("gallery_urls")
    .eq("id", user.id)
    .single();
  if (existingError) return { error: existingError.message };
  const current: string[] = existing?.gallery_urls ?? [];
  const nextGallery = current.filter((u) => u !== url);

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ gallery_urls: nextGallery })
    .eq("id", user.id)
    .select("role")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/${updated.role}`, "layout");
  return { success: true };
}

export async function uploadEventPhoto(
  formData: FormData
): Promise<{ error: string } | { success: true; path: string; url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const validated = validateImage(formData.get("image"));
  if ("error" in validated) return validated;
  const { file } = validated;

  const extensionByType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  const ext = extensionByType[file.type] ?? "jpg";
  const path = `${user.id}/events/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-media")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-media").getPublicUrl(path);

  return { success: true, path, url: publicUrl };
}

export async function removeEventPhoto(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const path = String(formData.get("path") ?? "");
  const prefix = `${user.id}/events/`;
  const filename = path.slice(prefix.length);
  if (!path.startsWith(prefix) || !/^[0-9a-f-]+\.(?:png|jpg|webp)$/i.test(filename)) {
    return { error: "Invalid event photo." };
  }

  const { error } = await supabase.storage.from("profile-media").remove([path]);
  if (error) return { error: error.message };

  return { success: true };
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
