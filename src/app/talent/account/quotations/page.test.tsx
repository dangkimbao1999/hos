import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { QuotationWithNames } from "@/lib/supabase/types";

mock.module("@/lib/supabase/server", () => ({
  getCurrentProfile: async () => ({ id: "talent-1" }),
}));

let pageArgs: { talentId: string; page: number } | null = null;
let pageResult: { quotations: QuotationWithNames[]; totalCount: number } = { quotations: [], totalCount: 0 };
mock.module("@/lib/supabase/quotations", () => ({
  listQuotationsForTalentPage: async (talentId: string, page: number) => {
    pageArgs = { talentId, page };
    return pageResult;
  },
}));
mock.module("@/components/account/account-shell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

let quotationsContentProps: Record<string, unknown> | null = null;
mock.module("@/components/account/quotations-content", () => ({
  QuotationsContent: (props: Record<string, unknown>) => {
    quotationsContentProps = props;
    return <div data-testid="content" />;
  },
}));

import TalentQuotationsPage from "@/app/talent/account/quotations/page";

function makeQuotation(id: string): QuotationWithNames {
  return { id } as unknown as QuotationWithNames;
}

describe("TalentQuotationsPage", () => {
  it("fetches the current page of quotations, passing them to QuotationsContent", async () => {
    pageResult = { quotations: [makeQuotation("q-1")], totalCount: 15 };
    const jsx = await TalentQuotationsPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(pageArgs).toEqual({ talentId: "talent-1", page: 1 });
    expect(quotationsContentProps).toMatchObject({
      role: "talent",
      quotations: pageResult.quotations,
      currentPage: 1,
      totalPages: 2,
    });
  });

  it("resolves the page number from ?page=", async () => {
    pageResult = { quotations: [], totalCount: 0 };
    await render(await TalentQuotationsPage({ searchParams: Promise.resolve({ page: "3" }) }));
    expect(pageArgs).toEqual({ talentId: "talent-1", page: 3 });
  });
});
