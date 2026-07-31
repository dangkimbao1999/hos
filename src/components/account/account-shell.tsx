import type { ReactNode } from "react";
import { AccountTabs } from "@/components/account/account-tabs";
import type { Role } from "@/lib/nav-items";

export function AccountShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground">My Account</h1>
        <p className="text-sm text-muted-foreground">Use filter for better search experience</p>
      </div>
      <AccountTabs role={role} />
      {children}
    </div>
  );
}
