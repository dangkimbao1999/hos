import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for Supabase's confirmation/recovery emails. Supabase's
 * default (uncustomized) email templates point at its own /verify endpoint,
 * which then redirects here with a `?code=` param — exchange it for a
 * session, then continue to wherever the flow that sent the email wants
 * the user to land next.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(`${origin}${next}`);
    }
  }

  redirect(`${origin}/sign-in`);
}
