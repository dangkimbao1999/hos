import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { listNotifications } from "@/lib/supabase/notifications";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (profile.role !== "talent") redirect(`/${profile.role}`);

  const notifications = await listNotifications(profile.id, "talent", profile.notifications_read_at);

  return (
    <AppShell
      role="talent"
      userName={profile.full_name}
      userAvatarUrl={profile.avatar_url}
      kycStatus={profile.kyc_status}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
