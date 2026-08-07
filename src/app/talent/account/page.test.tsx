import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption, Profile } from "@/lib/supabase/types";

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => [{ id: "cat-1", name: "DJ", subcategories: [] }] as CategoryOption[],
  listCities: async () => [{ id: "city-1", name: "Hanoi" }] as LookupOption[],
  listGenres: async () => [{ id: "genre-1", name: "Rap" }] as LookupOption[],
}));
mock.module("@/lib/supabase/server", () => ({
  getCurrentProfile: async () => ({ id: "talent-1", role: "talent" }) as Profile,
}));
mock.module("@/components/account/account-shell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
mock.module("@/components/account/profile-content", () => ({
  ProfileContent: (props: {
    categories: CategoryOption[];
    cities: LookupOption[];
    genres: LookupOption[];
  }) => (
    <div data-testid="content">
      {props.categories.map((c) => c.name).join(",")}|{props.cities.map((c) => c.name).join(",")}|
      {props.genres.map((g) => g.name).join(",")}
    </div>
  ),
}));

import TalentProfilePage from "@/app/talent/account/page";

describe("TalentProfilePage", () => {
  it("fetches categories/cities/genres and passes them to ProfileContent", async () => {
    const jsx = await TalentProfilePage();
    render(jsx);
    expect(screen.getByTestId("content")).toHaveTextContent("DJ|Hanoi|Rap");
  });
});
