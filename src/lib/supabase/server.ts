import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CurrentUser } from "@/lib/supabase/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Called from a Server Component render (no response to attach to) — the
          // proxy's session refresh already keeps cookies current, so this is safe to ignore.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // no-op, see comment above
          }
        },
      },
    }
  );
}

/** Current signed-in user's profile row (+ auth email), or null if not signed in. */
export async function getCurrentProfile(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { ...profile, email: user.email ?? "" } as CurrentUser;
}
