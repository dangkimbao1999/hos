import { createClient } from "@/lib/supabase/server";

/**
 * Every mutating action (create/apply/book/accept) must call this first —
 * only browsing stays open to unverified users. Returns null when the
 * signed-in user is KYC-verified and clear to proceed, or an error object
 * to return directly from the calling action.
 */
export async function assertKycVerified(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ error: string } | null> {
  const { data: profile } = await supabase.from("profiles").select("kyc_status").eq("id", userId).single();

  if (!profile || profile.kyc_status !== "verified") {
    return { error: "Complete KYC verification before you can do this." };
  }
  return null;
}
