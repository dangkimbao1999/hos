import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (profile.role !== "talent") redirect(`/${profile.role}`);

  return children;
}
