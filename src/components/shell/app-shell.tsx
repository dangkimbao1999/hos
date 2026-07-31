import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import type { CartItemWithPackage } from "@/lib/supabase/types";
import type { Role } from "@/lib/nav-items";

export function AppShell({
  role,
  userName,
  userAvatarUrl,
  cartItems,
  children,
}: {
  role: Role;
  userName: string;
  userAvatarUrl?: string | null;
  cartItems?: CartItemWithPackage[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} userName={userName} userAvatarUrl={userAvatarUrl} cartItems={cartItems} />
        <main className="flex-1 px-8 pb-12">{children}</main>
      </div>
    </div>
  );
}
