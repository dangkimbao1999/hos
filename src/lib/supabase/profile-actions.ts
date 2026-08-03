"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";

export async function updateProfile(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const fullName = String(formData.get("fullName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;

  if (!fullName) return { error: "Display name is required." };

  const update: { full_name: string; bio: string | null; location: string | null; keywords?: string[] } = {
    full_name: fullName,
    bio,
    location,
  };
  const keywordsRaw = formData.get("keywords");
  if (keywordsRaw !== null) {
    try {
      const parsed = JSON.parse(String(keywordsRaw));
      if (Array.isArray(parsed)) update.keywords = parsed.map(String);
    } catch {
      return { error: "Invalid keywords." };
    }
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select("role")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/${profile.role}/account`);
  return { success: true };
}
