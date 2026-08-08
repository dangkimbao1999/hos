import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "quotations") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: "quote-1",
                    organizer_id: "org-1",
                    talent_id: "talent-1",
                    event_name: "Wedding",
                    event_date: "2026-12-01",
                    venue: "Riverside Palace",
                    city_id: "city-hcm",
                    address: "123 Main St",
                    description: null,
                    budget_min_vnd: null,
                    budget_max_vnd: null,
                    status: "pending",
                    quoted_price_vnd: null,
                    talent_note: null,
                    created_at: "2026-08-01T00:00:00Z",
                    updated_at: "2026-08-01T00:00:00Z",
                  },
                ],
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: async () => ({
              data: [
                { id: "org-1", full_name: "Test Organizer" },
                { id: "talent-1", full_name: "Test Talent" },
              ],
            }),
          }),
        };
      }
      if (table === "cities") {
        return { select: () => ({ in: async () => ({ data: [{ id: "city-hcm", name: "HCM City" }] }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { listQuotationsForOrganizer, listQuotationsForTalent } from "@/lib/supabase/quotations";

describe("listQuotationsForOrganizer / listQuotationsForTalent", () => {
  test("resolves both parties' names and the perform city's name", async () => {
    const [result] = await listQuotationsForOrganizer("org-1");
    expect(result.organizer_name).toBe("Test Organizer");
    expect(result.talent_name).toBe("Test Talent");
    expect(result.city_name).toBe("HCM City");
    expect(result.address).toBe("123 Main St");
  });

  test("same resolution from the talent's side", async () => {
    const [result] = await listQuotationsForTalent("talent-1");
    expect(result.city_name).toBe("HCM City");
  });
});
