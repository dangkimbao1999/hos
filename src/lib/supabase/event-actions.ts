"use server";

import { createClient } from "@/lib/supabase/server";
import { assertKycVerified } from "@/lib/supabase/kyc";
import { parseEventPhotoPaths } from "@/lib/supabase/event-photo-validation";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base || "event"}-${suffix}`;
}

/** "21:30" -> "21:30:00", plus a time `minutesLater` after it, same format. */
function toTimeRange(hhmm: string, minutesLater: number): { start: string; end: string } {
  const [hh, mm] = hhmm.split(":").map(Number);
  const start = `${String(hh || 0).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}:00`;
  const end = new Date(2000, 0, 1, hh || 0, mm || 0);
  end.setMinutes(end.getMinutes() + minutesLater);
  return {
    start,
    end: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}:00`,
  };
}

export async function createEvent(
  formData: FormData
): Promise<{ error: string } | { success: true; slug: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const name = String(formData.get("eventName") ?? "");
  const eventDate = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const venue = String(formData.get("venue") ?? "");
  const description = String(formData.get("description") ?? "") || null;
  const budgetMinVnd = Number(formData.get("budgetMin") ?? 0) || null;
  const budgetMaxVnd = Number(formData.get("budgetMax") ?? 0) || null;
  const expectedGuests = Number(formData.get("guests") ?? 0) || null;
  const specialRequirements = String(formData.get("requirements") ?? "") || null;
  const parsedPhotos = parseEventPhotoPaths(formData.get("photoPaths"), user.id);
  if ("error" in parsedPhotos) return parsedPhotos;
  const photoUrls = parsedPhotos.paths.map(
    (path) => supabase.storage.from("profile-media").getPublicUrl(path).data.publicUrl
  );

  const slotsRaw = String(formData.get("slots") ?? "[]");
  let parsedSlots: { categoryId: string; priceUsd: string; quantity: string }[];
  try {
    parsedSlots = JSON.parse(slotsRaw);
  } catch {
    return { error: "Invalid talent slots." };
  }
  const slots = parsedSlots
    .map((s) => ({
      category_id: s.categoryId,
      price_usd: Number(s.priceUsd ?? 0),
      quantity_total: Math.max(1, Number(s.quantity ?? 1)),
    }))
    .filter((s) => s.category_id);
  if (slots.length === 0) return { error: "Add at least one talent slot." };

  // The wizard only collects a single start time — default a 90-minute set.
  const { start: startTime, end: endTime } = toTimeRange(time, 90);
  const slug = slugify(name);

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      slug,
      name,
      venue,
      address: venue,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      description,
      budget_min_vnd: budgetMinVnd,
      budget_max_vnd: budgetMaxVnd,
      expected_guests: expectedGuests,
      special_requirements: specialRequirements,
      photo_urls: photoUrls,
    })
    .select()
    .single();

  if (eventError || !event) return { error: eventError?.message ?? "Could not create event" };

  const { error: slotError } = await supabase.from("event_slots").insert(
    slots.map((slot) => ({
      event_id: event.id,
      category_id: slot.category_id,
      price_usd: slot.price_usd,
      quantity_total: slot.quantity_total,
    }))
  );

  if (slotError) return { error: slotError.message };

  return { success: true, slug };
}

export async function applyToSlot(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const slotId = String(formData.get("slotId") ?? "");
  const offerRaw = formData.get("offerAmountUsd");
  const offerAmountUsd = offerRaw ? Number(offerRaw) || null : null;

  const { error } = await supabase.from("event_applications").insert({
    slot_id: slotId,
    applicant_profile_id: user.id,
    offer_amount_usd: offerAmountUsd,
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already applied to this slot." };
    return { error: error.message };
  }

  return { success: true };
}

export async function acceptApplication(
  applicationId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const { error } = await supabase
    .from("event_applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function rejectApplication(
  applicationId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const kycError = await assertKycVerified(supabase, user.id);
  if (kycError) return kycError;

  const { error } = await supabase
    .from("event_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  return { success: true };
}
