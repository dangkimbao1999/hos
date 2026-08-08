import { afterEach, describe, expect, it, mock } from "bun:test";

const revalidatePath = mock(() => {});
mock.module("next/cache", () => ({ revalidatePath }));

const USER_ID = "11111111-1111-1111-1111-111111111111";

function makeSupabase(options: { user: { id: string } | null; kycStatus?: string }) {
  const inserted: { quotations?: Record<string, unknown> } = {};

  return {
    auth: { getUser: async () => ({ data: { user: options.user } }) },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { kyc_status: options.kycStatus ?? "verified" } }),
            }),
          }),
        };
      }
      if (table === "quotations") {
        return {
          insert: async (row: Record<string, unknown>) => {
            inserted.quotations = row;
            return { error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    __inserted: inserted,
  };
}

let supabaseMock = makeSupabase({ user: { id: USER_ID } });

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => supabaseMock,
}));

import { requestQuotation } from "@/lib/supabase/quotation-actions";

afterEach(() => {
  revalidatePath.mockClear();
});

function quoteFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("talentId", "talent-1");
  formData.set("eventName", "Wedding Reception");
  formData.set("eventDate", "2026-12-01");
  formData.set("eventStartTime", "20:00");
  formData.set("eventEndTime", "21:00");
  formData.set("cityId", "city-hcm");
  formData.set("address", "123 Main St");
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

describe("requestQuotation — signed-out guard", () => {
  it("rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await requestQuotation(quoteFormData())).toEqual({ error: "You must be signed in." });
  });
});

describe("requestQuotation", () => {
  it("persists the perform city/address alongside the request", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    const result = await requestQuotation(quoteFormData());
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__inserted.quotations).toMatchObject({
      city_id: "city-hcm",
      address: "123 Main St",
    });
  });

  it("requires a perform city", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(await requestQuotation(quoteFormData({ cityId: "" }))).toEqual({
      error: "Select the perform city.",
    });
  });

  it("requires a perform address", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(await requestQuotation(quoteFormData({ address: "" }))).toEqual({
      error: "Enter the perform address.",
    });
  });

  it("still requires an event name", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(await requestQuotation(quoteFormData({ eventName: "" }))).toEqual({
      error: "Event name is required.",
    });
  });

  it("requires an event date", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(await requestQuotation(quoteFormData({ eventDate: "" }))).toEqual({
      error: "Event date is required.",
    });
  });

  it("requires a start time", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(await requestQuotation(quoteFormData({ eventStartTime: "" }))).toEqual({
      error: "Enter a start time.",
    });
  });

  it("requires an end time", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(await requestQuotation(quoteFormData({ eventEndTime: "" }))).toEqual({
      error: "Enter an end time.",
    });
  });

  it("rejects an end time at or before the start time", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(
      await requestQuotation(quoteFormData({ eventStartTime: "20:00", eventEndTime: "20:00" }))
    ).toEqual({ error: "End time must be after start time." });
  });

  it("persists the requested start and end time", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    await requestQuotation(quoteFormData({ eventStartTime: "14:00", eventEndTime: "15:30" }));
    expect(supabaseMock.__inserted.quotations).toMatchObject({
      event_start_time: "14:00",
      event_end_time: "15:30",
    });
  });
});
