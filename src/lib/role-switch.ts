import { mockEventDetail } from "@/lib/mock-event-detail";
import { mockTalentDetail } from "@/lib/mock-talent-detail";
import type { Role } from "@/lib/nav-items";

/**
 * Maps the current pathname to its closest equivalent under a different role.
 * Stand-in for backend-driven role routing — once auth returns a real role,
 * this switcher (and this mapping) goes away.
 */
export function getEquivalentPath(pathname: string, fromRole: Role, toRole: Role): string {
  if (fromRole === toRole) return pathname;

  const rest = pathname.slice(`/${fromRole}`.length);

  if (rest === "") return `/${toRole}`;

  if (rest.startsWith("/account/events") || rest.startsWith("/account/packages")) {
    return `/${toRole}/account/${toRole === "organizer" ? "events" : "packages"}`;
  }

  if (rest.startsWith("/talents/") || rest.startsWith("/events/")) {
    return toRole === "organizer"
      ? `/organizer/talents/${mockTalentDetail.slug}`
      : `/${toRole}/events/${mockEventDetail.slug}`;
  }

  if (rest === "/checkout") {
    return `/${toRole}`;
  }

  // Generic 1:1 routes: /discover, /create, /kyc, /account, /account/orders, /account/schedule, /account/billing
  return `/${toRole}${rest}`;
}
