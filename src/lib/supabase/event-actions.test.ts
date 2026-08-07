import { describe, expect, it, mock } from "bun:test";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function makeSupabase(options: {
  user: { id: string } | null;
  kycStatus?: string;
  insertedEvent?: Record<string, unknown> | null;
  eventError?: { message: string } | null;
  slotError?: { message: string } | null;
}) {
  const inserted: { events?: Record<string, unknown>; event_slots?: unknown[] } = {};

  return {
    auth: {
      getUser: async () => ({ data: { user: options.user } }),
    },
    storage: {
      from: (bucket: string) => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.com/${bucket}/${path}` },
        }),
      }),
    },
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
      if (table === "events") {
        return {
          insert: (row: Record<string, unknown>) => {
            inserted.events = row;
            return {
              select: () => ({
                single: async () => ({
                  data: options.eventError ? null : (options.insertedEvent ?? { id: "event-1" }),
                  error: options.eventError ?? null,
                }),
              }),
            };
          },
        };
      }
      if (table === "event_slots") {
        return {
          insert: async (rows: unknown[]) => {
            inserted.event_slots = rows;
            return { error: options.slotError ?? null };
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

import { createEvent } from "@/lib/supabase/event-actions";

function baseFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("eventName", "Summer Music Festival");
  formData.set("date", "2026-09-01");
  formData.set("time", "20:00");
  formData.set("venue", "ABC Dance Zone, HCMC");
  formData.set("description", "");
  formData.set("budgetMin", "10000000");
  formData.set("budgetMax", "50000000");
  formData.set("guests", "200");
  formData.set("requirements", "");
  formData.set("photoPaths", "[]");
  formData.set(
    "slots",
    JSON.stringify([{ categoryId: "22222222-2222-2222-2222-222222222222", priceUsd: "2000", quantity: "1" }])
  );
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

describe("createEvent", () => {
  it("rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await createEvent(baseFormData())).toEqual({ error: "You must be signed in." });
  });

  it("rejects when no talent slots are provided", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    const result = await createEvent(baseFormData({ slots: "[]" }));
    expect(result).toEqual({ error: "Add at least one talent slot." });
  });

  it("propagates invalid event photo errors instead of creating the event", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    const result = await createEvent(baseFormData({ photoPaths: "not-json" }));
    expect(result).toEqual({ error: "Invalid event photos." });
  });

  it("persists resolved photo URLs on the created event", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    const path = `${USER_ID}/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png`;
    const result = await createEvent(baseFormData({ photoPaths: JSON.stringify([path]) }));
    expect(result).toEqual({ success: true, slug: expect.stringContaining("summer-music-festival") });
    expect(supabaseMock.__inserted.events?.photo_urls).toEqual([`https://example.com/profile-media/${path}`]);
  });
});
