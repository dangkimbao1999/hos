"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CartButton } from "@/components/shell/cart-button";
import { NotificationButton } from "@/components/shell/notification-button";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { SearchBar } from "@/components/shell/search-bar";
import type { CartItemWithPackage, NotificationItem } from "@/lib/supabase/types";
import type { Role } from "@/lib/nav-items";

export function Topbar({
  role,
  userName,
  userAvatarUrl,
  cartItems,
  notifications,
}: {
  role: Role;
  userName: string;
  userAvatarUrl?: string | null;
  cartItems?: CartItemWithPackage[];
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/${role}/discover?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="flex items-center justify-between gap-6 px-8 py-5">
      <SearchBar
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
          }
        }}
      />
      <div className="flex shrink-0 items-center gap-[18px]">
        <NotificationButton role={role} notifications={notifications} />
        {role === "organizer" && <CartButton role={role} cartItems={cartItems} />}
        <ProfileMenu name={userName} role={role} avatarUrl={userAvatarUrl} />
      </div>
    </header>
  );
}
