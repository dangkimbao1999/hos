"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";

export async function submitReview(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const sourceType = String(formData.get("sourceType") ?? "");
  const sourceId = String(formData.get("sourceId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (rating < 1 || rating > 5) return { error: "Choose a rating between 1 and 5." };
  if (sourceType !== "booking" && sourceType !== "application") return { error: "Invalid review source." };
  if (!sourceId) return { error: "Missing booking or application." };

  let talentId: string | null = null;
  if (sourceType === "booking") {
    const { data: booking } = await supabase
      .from("package_bookings")
      .select("package_id")
      .eq("id", sourceId)
      .single();
    if (booking) {
      const { data: pkg } = await supabase
        .from("packages")
        .select("talent_id")
        .eq("id", booking.package_id)
        .single();
      talentId = pkg?.talent_id ?? null;
    }
  } else {
    const { data: application } = await supabase
      .from("event_applications")
      .select("applicant_profile_id")
      .eq("id", sourceId)
      .single();
    talentId = application?.applicant_profile_id ?? null;
  }
  if (!talentId) return { error: "Couldn't find that booking or application." };

  const { error } = await supabase.from("reviews").insert({
    reviewer_id: user.id,
    talent_id: talentId,
    booking_id: sourceType === "booking" ? sourceId : null,
    application_id: sourceType === "application" ? sourceId : null,
    rating,
    comment,
  });
  if (error) return { error: error.message };

  revalidatePath("/organizer/account/orders");
  revalidatePath("/organizer/account/events");
  return { success: true };
}
