import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CategoryOption, LookupOption, PackageRow } from "@/lib/supabase/types";

mock.module("@/lib/supabase/lookups", () => ({
  listCategories: async () => [{ id: "cat-1", name: "DJ", subcategories: [] }] as CategoryOption[],
  listCities: async () => [{ id: "city-1", name: "Hanoi" }] as LookupOption[],
}));

let pageArgs: { talentId: string; page: number } | null = null;
let pageResult: { packages: (PackageRow & { bookingCount: number })[]; totalCount: number } = {
  packages: [],
  totalCount: 0,
};
mock.module("@/lib/supabase/packages", () => ({
  listPackagesWithBookingCountsPage: async (talentId: string, page: number) => {
    pageArgs = { talentId, page };
    return pageResult;
  },
}));
mock.module("@/lib/supabase/server", () => ({
  getCurrentProfile: async () => ({ id: "talent-1" }),
}));
mock.module("@/components/account/account-shell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

let packagesContentProps: Record<string, unknown> | null = null;
mock.module("@/components/account/packages-content", () => ({
  PackagesContent: (props: Record<string, unknown>) => {
    packagesContentProps = props;
    return (
      <div data-testid="content">
        {(props.categories as CategoryOption[]).map((c) => c.name).join(",")}|
        {(props.cities as LookupOption[]).map((c) => c.name).join(",")}
      </div>
    );
  },
}));

import TalentPackagesPage from "@/app/talent/account/packages/page";

describe("TalentPackagesPage", () => {
  it("fetches categories/cities/the current page and passes them to PackagesContent", async () => {
    pageResult = { packages: [], totalCount: 25 };
    const jsx = await TalentPackagesPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByTestId("content")).toHaveTextContent("DJ|Hanoi");
    expect(pageArgs).toEqual({ talentId: "talent-1", page: 1 });
    expect(packagesContentProps).toMatchObject({ currentPage: 1, totalPages: 3 });
  });

  it("resolves the page number from ?page=", async () => {
    pageResult = { packages: [], totalCount: 0 };
    await render(await TalentPackagesPage({ searchParams: Promise.resolve({ page: "2" }) }));
    expect(pageArgs).toEqual({ talentId: "talent-1", page: 2 });
  });
});
