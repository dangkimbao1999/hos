import { CartButton } from "@/components/shell/cart-button";
import { NotificationButton } from "@/components/shell/notification-button";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { RoleSwitcher } from "@/components/shell/role-switcher";
import { SearchBar } from "@/components/shell/search-bar";
import type { Role } from "@/lib/nav-items";

export function Topbar({ role, userName }: { role: Role; userName: string }) {
  return (
    <header className="flex items-center justify-between gap-6 px-8 py-5">
      <SearchBar />
      <div className="flex shrink-0 items-center gap-[18px]">
        <RoleSwitcher role={role} />
        <NotificationButton />
        {role === "organizer" && <CartButton role={role} />}
        <ProfileMenu name={userName} role={role} />
      </div>
    </header>
  );
}
