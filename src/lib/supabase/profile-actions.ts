"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";
import { parseAchievements, parseServices, parseSocialLinks } from "@/lib/supabase/profile-parsing";
import type { Achievement, SocialLink } from "@/lib/supabase/types";

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
  const cityId = String(formData.get("cityId") ?? "").trim() || null;
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim() || null;
  const genreId = String(formData.get("genreId") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const subcategoryId = String(formData.get("subcategoryId") ?? "").trim() || null;

  if (!fullName) return { error: "Display name is required." };

  const update: {
    full_name: string;
    bio: string | null;
    city_id: string | null;
    date_of_birth: string | null;
    genre_id: string | null;
    category_id: string | null;
    subcategory_id: string | null;
    keywords?: string[];
    social_links?: SocialLink[];
    achievements?: Achievement[];
    services?: string[];
  } = {
    full_name: fullName,
    bio,
    city_id: cityId,
    date_of_birth: dateOfBirth,
    genre_id: genreId,
    category_id: categoryId,
    subcategory_id: subcategoryId,
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

  // Not role-restricted server-side — harmless for Organizer/Agency since no UI surface renders
  // these Talent-only fields (achievements, services, dateOfBirth, genre) for those roles.
  const socialLinksRaw = formData.get("socialLinks");
  if (socialLinksRaw !== null) {
    const parsed = parseSocialLinks(socialLinksRaw);
    if (parsed === null) return { error: "Invalid social links." };
    update.social_links = parsed;
  }

  const achievementsRaw = formData.get("achievements");
  if (achievementsRaw !== null) {
    const parsed = parseAchievements(achievementsRaw);
    if (parsed === null) return { error: "Invalid achievements." };
    update.achievements = parsed;
  }

  const servicesRaw = formData.get("services");
  if (servicesRaw !== null) {
    const parsed = parseServices(servicesRaw);
    if (parsed === null) return { error: "Invalid services." };
    update.services = parsed;
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
