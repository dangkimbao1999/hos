"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";

export async function requestQuotation(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const talentId = String(formData.get("talentId") ?? "");
  const eventName = String(formData.get("eventName") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "") || null;
  const eventStartTime = String(formData.get("eventStartTime") ?? "") || null;
  const eventEndTime = String(formData.get("eventEndTime") ?? "") || null;
  const venue = String(formData.get("venue") ?? "").trim() || null;
  const cityId = String(formData.get("cityId") ?? "") || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const budgetMinVnd = Number(formData.get("budgetMin") ?? 0) || null;
  const budgetMaxVnd = Number(formData.get("budgetMax") ?? 0) || null;

  if (!talentId) return { error: "Missing talent." };
  if (!eventName) return { error: "Event name is required." };
  if (!eventDate) return { error: "Event date is required." };
  if (!cityId) return { error: "Select the perform city." };
  if (!address) return { error: "Enter the perform address." };
  // A quotation isn't tied to any package, so there's no availability
  // window to pick a start time from -- just a specific requested slot.
  if (!eventStartTime) return { error: "Enter a start time." };
  if (!eventEndTime) return { error: "Enter an end time." };
  if (eventEndTime <= eventStartTime) return { error: "End time must be after start time." };

  const { error } = await supabase.from("quotations").insert({
    organizer_id: user.id,
    talent_id: talentId,
    event_name: eventName,
    event_date: eventDate,
    event_start_time: eventStartTime,
    event_end_time: eventEndTime,
    venue,
    city_id: cityId,
    address,
    description,
    budget_min_vnd: budgetMinVnd,
    budget_max_vnd: budgetMaxVnd,
  });
  if (error) return { error: error.message };

  revalidatePath("/talent/account/quotations");
  return { success: true };
}

export async function respondToQuotation(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const quotationId = String(formData.get("quotationId") ?? "");
  const quotedPriceVnd = Number(formData.get("quotedPriceVnd") ?? 0);
  const talentNote = String(formData.get("talentNote") ?? "").trim() || null;

  if (quotedPriceVnd <= 0) return { error: "Enter a valid quote price." };

  const { error } = await supabase
    .from("quotations")
    .update({ status: "quoted", quoted_price_vnd: quotedPriceVnd, talent_note: talentNote })
    .eq("id", quotationId)
    .eq("talent_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/organizer/account/quotations");
  return { success: true };
}

export async function declineQuotation(quotationId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const { error } = await supabase
    .from("quotations")
    .update({ status: "declined" })
    .eq("id", quotationId)
    .eq("talent_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/organizer/account/quotations");
  return { success: true };
}

export async function acceptQuotation(quotationId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const { error } = await supabase
    .from("quotations")
    .update({ status: "accepted" })
    .eq("id", quotationId)
    .eq("organizer_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/talent/account/quotations");
  return { success: true };
}

export async function rejectQuotation(quotationId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const { error } = await supabase
    .from("quotations")
    .update({ status: "rejected" })
    .eq("id", quotationId)
    .eq("organizer_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/talent/account/quotations");
  return { success: true };
}
