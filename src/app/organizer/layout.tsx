import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { listNotifications } from "@/lib/supabase/notifications";
import { listCartItems } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (profile.role !== "organizer") redirect(`/${profile.role}`);

  const [cartItems, notifications] = await Promise.all([
    listCartItems(profile.id),
    listNotifications(profile.id, "organizer", profile.notifications_read_at),
  ]);

  return (
    <AppShell
      role="organizer"
      userName={profile.full_name}
      userAvatarUrl={profile.avatar_url}
      kycStatus={profile.kyc_status}
      cartItems={cartItems}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
