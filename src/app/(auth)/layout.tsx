import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();
  if (profile) redirect(`/${profile.role}`);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      {children}
    </div>
  );
}
