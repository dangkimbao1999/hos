"use server";

import { createClient } from "@/lib/supabase/server";

export async function markNotificationsRead(): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ notifications_read_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}
