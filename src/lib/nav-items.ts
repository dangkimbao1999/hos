export type Role = "organizer" | "talent" | "agency";

export const createEventCta: Record<Role, string> = {
  organizer: "Create new Event",
  talent: "Create new Package",
  agency: "Create new Package",
};

export interface CategoryItem {
  label: string;
  subcategories?: string[];
}

/**
 * Confirmed against Figma for the Organizer sidebar. Talent/Agency likely browse
 * a different taxonomy (event types rather than talent types) — reusing this list
 * for now pending that screen's Figma data.
 */
export const talentCategories: CategoryItem[] = [
  { label: "Solo Singer", subcategories: ["Rapper", "Ballad", "RnB", "Bolero"] },
  { label: "Band" },
  { label: "Dancer" },
  { label: "Instrument" },
  { label: "DJ" },
  { label: "Stylish" },
  { label: "Make-up" },
  { label: "Bartender" },
];
