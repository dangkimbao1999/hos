import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (profile.role !== "organizer") redirect(`/${profile.role}`);

  return (
    <AppShell role="organizer" userName={profile.full_name} userAvatarUrl={profile.avatar_url}>
      {children}
    </AppShell>
  );
}
