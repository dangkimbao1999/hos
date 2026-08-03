import type { Role } from "@/lib/nav-items";

export interface AccountNavItem {
  label: string;
  href: string;
}

export function getAccountNavItems(role: Role): AccountNavItem[] {
  const base = `/${role}/account`;

  if (role === "organizer") {
    return [
      { label: "My Profile", href: base },
      { label: "My Events", href: `${base}/events` },
      { label: "My Orders", href: `${base}/orders` },
      { label: "Quotations", href: `${base}/quotations` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Billing", href: `${base}/billing` },
    ];
  }

  return [
    { label: "My Profile", href: base },
    ...(role === "agency" ? [{ label: "My Talents", href: `${base}/talents` }] : []),
    { label: "My Packages", href: `${base}/packages` },
    { label: "My Orders", href: `${base}/orders` },
    ...(role === "talent" ? [{ label: "Quotations", href: `${base}/quotations` }] : []),
    { label: "Schedule", href: `${base}/schedule` },
    { label: "Billing", href: `${base}/billing` },
  ];
}
