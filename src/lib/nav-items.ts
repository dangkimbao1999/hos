export type Role = "organizer" | "talent" | "agency";

export const createEventCta: Record<Role, string> = {
  organizer: "Create new Event",
  talent: "Create new Package",
  agency: "Create new Package",
};
