"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/nav-items";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function signIn(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(`/${profile?.role ?? "organizer"}`);
}

export async function signUp(formData: FormData): Promise<{ error: string } | { success: true }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const role = String(formData.get("role") ?? "organizer") as Role;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/`,
    },
  });
  if (error) return { error: error.message };

  return { success: true };
}

export async function resendSignUpEmail(email: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=/` },
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function requestPasswordReset(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const email = String(formData.get("email") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent("/forgot-password?step=reset")}`,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePassword(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password !== confirmPassword) return { error: "Passwords do not match" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
