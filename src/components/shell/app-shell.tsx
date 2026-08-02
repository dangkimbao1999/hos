import type { ReactNode } from "react";
import { KycBanner } from "@/components/shell/kyc-banner";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import type { CartItemWithPackage, KycStatus } from "@/lib/supabase/types";
import type { Role } from "@/lib/nav-items";

export function AppShell({
  role,
  userName,
  userAvatarUrl,
  kycStatus,
  cartItems,
  children,
}: {
  role: Role;
  userName: string;
  userAvatarUrl?: string | null;
  kycStatus: KycStatus;
  cartItems?: CartItemWithPackage[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar role={role} kycStatus={kycStatus} />
      <div className="flex min-w-0 flex-1 flex-col">
        <KycBanner role={role} status={kycStatus} />
        <Topbar role={role} userName={userName} userAvatarUrl={userAvatarUrl} cartItems={cartItems} />
        <main className="flex-1 px-8 pb-12">{children}</main>
      </div>
    </div>
  );
}
