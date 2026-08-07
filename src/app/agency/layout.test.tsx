import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption, Profile } from "@/lib/supabase/types";

mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => [{ id: "cat-1", name: "DJ", subcategories: [] }] as CategoryOption[],
  listCities: async () => [{ id: "city-1", name: "Hanoi" }] as LookupOption[],
}));
mock.module("@/lib/supabase/notifications", () => ({ listNotifications: async () => [] }));

let profileToReturn: Profile | null = { id: "agency-1", role: "agency", full_name: "Test Agency" } as Profile;
mock.module("@/lib/supabase/server", () => ({ getCurrentProfile: async () => profileToReturn }));

mock.module("@/components/shell/app-shell", () => ({
  AppShell: (props: { categories: CategoryOption[]; cities: LookupOption[]; children: React.ReactNode }) => (
    <div data-testid="shell">
      {props.categories.map((c) => c.name).join(",")}|{props.cities.map((c) => c.name).join(",")}
      {props.children}
    </div>
  ),
}));

import AgencyLayout from "@/app/agency/layout";

describe("AgencyLayout", () => {
  it("fetches categories/cities and passes them to AppShell", async () => {
    profileToReturn = { id: "agency-1", role: "agency", full_name: "Test Agency" } as Profile;
    const jsx = await AgencyLayout({ children: <span>child</span> });
    render(jsx);
    expect(screen.getByTestId("shell")).toHaveTextContent("DJ|Hanoi");
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("redirects to sign-in when there is no signed-in profile", async () => {
    profileToReturn = null;
    await expect(AgencyLayout({ children: <span /> })).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("redirects to the profile's own role home when role doesn't match", async () => {
    profileToReturn = { id: "talent-1", role: "talent", full_name: "Wrong Role" } as Profile;
    await expect(AgencyLayout({ children: <span /> })).rejects.toThrow("REDIRECT:/talent");
  });
});
