"use server";

import { createClient } from "@/lib/supabase/server";

export async function createPackage(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const category = String(formData.get("category") ?? "");
  const subCategory = String(formData.get("subCategory") ?? "") || null;
  const title = String(formData.get("title") ?? "");
  const residency = String(formData.get("residency") ?? "") || null;
  const location = String(formData.get("location") ?? "");
  const repeatOn = formData.get("repeatOn") === "true";
  const repeatDaysRaw = String(formData.get("repeatDays") ?? "");
  const repeatDays = repeatOn && repeatDaysRaw ? repeatDaysRaw.split(",") : null;
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const description = String(formData.get("description") ?? "") || null;
  const priceMinVnd = Number(formData.get("priceMin") ?? 0);
  const priceMaxVnd = Number(formData.get("priceMax") ?? 0);
  const paymentMethod = String(formData.get("paymentMethod") ?? "Prepaid");

  const { error } = await supabase.from("packages").insert({
    talent_id: user.id,
    category,
    sub_category: subCategory,
    title,
    residency,
    location,
    repeat_on: repeatOn,
    repeat_days: repeatDays,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    description,
    price_min_vnd: priceMinVnd,
    price_max_vnd: priceMaxVnd,
    payment_method: paymentMethod,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function addToCart(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const packageId = String(formData.get("packageId") ?? "");
  const priceVnd = Number(formData.get("priceVnd") ?? 0);

  const { error } = await supabase.from("cart_items").insert({
    organizer_id: user.id,
    package_id: packageId,
    price_vnd: priceVnd,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function removeFromCart(
  cartItemId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function checkoutCart(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const paymentMethod = String(formData.get("paymentMethod") ?? "Prepaid");
  const itemIds = formData.getAll("itemIds").map(String);
  if (itemIds.length === 0) return { error: "Select at least one item to check out." };

  const { data: items } = await supabase
    .from("cart_items")
    .select("*")
    .eq("organizer_id", user.id)
    .in("id", itemIds);

  if (!items || items.length === 0) return { error: "Your cart is empty." };

  const { error: insertError } = await supabase.from("package_bookings").insert(
    items.map((item) => ({
      package_id: item.package_id,
      organizer_id: user.id,
      price_vnd: item.price_vnd,
      booked_date: item.booked_date,
      booked_time: item.booked_time,
      payment_method: paymentMethod,
    }))
  );
  if (insertError) return { error: insertError.message };

  await supabase
    .from("cart_items")
    .delete()
    .in("id", items.map((i) => i.id));

  return { success: true };
}

export async function acceptBooking(
  bookingId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("package_bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function rejectBooking(
  bookingId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("package_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (error) return { error: error.message };
  return { success: true };
}
