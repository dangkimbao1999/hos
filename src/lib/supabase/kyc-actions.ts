"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitKyc(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, kyc_status")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found." };
  if (profile.kyc_status === "pending") return { error: "Your verification is already under review." };
  if (profile.kyc_status === "verified") return { error: "You're already verified." };

  const submittedData: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    submittedData[key] = String(value);
  }

  const { error: insertError } = await supabase.from("kyc_submissions").insert({
    profile_id: user.id,
    role: profile.role,
    submitted_data: submittedData,
  });
  if (insertError) return { error: insertError.message };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ kyc_status: "pending" })
    .eq("id", user.id);
  if (updateError) return { error: updateError.message };

  return { success: true };
}
