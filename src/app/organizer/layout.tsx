import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { listCartItems } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (profile.role !== "organizer") redirect(`/${profile.role}`);

  const cartItems = await listCartItems(profile.id);

  return (
    <AppShell
      role="organizer"
      userName={profile.full_name}
      userAvatarUrl={profile.avatar_url}
      cartItems={cartItems}
    >
      {children}
    </AppShell>
  );
}
