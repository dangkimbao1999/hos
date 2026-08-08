import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { BookingWithNames } from "@/lib/supabase/types";

mock.module("@/lib/supabase/server", () => ({
  getCurrentProfile: async () => ({ id: "talent-1" }),
}));

let searchArgs: { role: string; profileId: string; filters: unknown; page: number } | null = null;
let searchResult: { bookings: BookingWithNames[]; totalCount: number } = { bookings: [], totalCount: 0 };
mock.module("@/lib/supabase/packages", () => ({
  resolveOrdersPageParams: (params: Record<string, string | string[] | undefined>) => ({
    status: typeof params.status === "string" ? params.status : null,
    search: typeof params.q === "string" ? params.q : null,
    page: params.page ? Number(params.page) : 1,
  }),
  searchBookingsForRole: async (role: string, profileId: string, filters: unknown, page: number) => {
    searchArgs = { role, profileId, filters, page };
    return searchResult;
  },
}));
mock.module("@/components/account/account-shell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

let ordersContentProps: Record<string, unknown> | null = null;
mock.module("@/components/account/orders-content", () => ({
  OrdersContent: (props: Record<string, unknown>) => {
    ordersContentProps = props;
    return <div data-testid="content" />;
  },
}));

import TalentOrdersPage from "@/app/talent/account/orders/page";

function makeBooking(id: string): BookingWithNames {
  return { id } as unknown as BookingWithNames;
}

describe("TalentOrdersPage", () => {
  it("fetches the current page of bookings, passing them to OrdersContent", async () => {
    searchResult = { bookings: [makeBooking("b-1")], totalCount: 25 };
    const jsx = await TalentOrdersPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(searchArgs).toMatchObject({ role: "talent", profileId: "talent-1", page: 1 });
    expect(ordersContentProps).toMatchObject({
      role: "talent",
      bookings: searchResult.bookings,
      currentPage: 1,
      totalPages: 3,
    });
  });

  it("resolves status/search/page from the URL params", async () => {
    searchResult = { bookings: [], totalCount: 0 };
    await render(
      await TalentOrdersPage({ searchParams: Promise.resolve({ status: "Pending", q: "beta", page: "4" }) })
    );
    expect(searchArgs?.filters).toMatchObject({ status: "Pending", search: "beta" });
    expect(searchArgs?.page).toBe(4);
  });
});
