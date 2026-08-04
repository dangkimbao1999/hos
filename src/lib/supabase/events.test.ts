import { describe, expect, it, mock } from "bun:test";

const eventRow = {
  id: "event-1",
  organizer_id: "org-1",
  slug: "my-event",
  name: "My Event",
};

function makeChain(resolved: unknown) {
  const chain: { select: () => typeof chain; eq: () => typeof chain; single: () => Promise<{ data: unknown }> } = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data: resolved }),
  };
  return chain;
}

function makeProfilesChain(fixture: Record<string, unknown>) {
  let selectedFields: string[] = [];
  const chain = {
    select: (fields: string) => {
      selectedFields = fields.split(",").map((f) => f.trim());
      return chain;
    },
    eq: () => chain,
    single: async () => {
      const data: Record<string, unknown> = {};
      for (const field of selectedFields) data[field] = fixture[field];
      return { data };
    },
  };
  return chain;
}

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "events") return makeChain(eventRow);
      if (table === "event_slots") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          order: async () => ({ data: [] }),
        };
        return chain;
      }
      if (table === "profiles") {
        return makeProfilesChain({
          full_name: "420 Ent.",
          location: "District 1, Ho Chi Minh City",
          bio: "The organizer's real bio.",
          gallery_urls: ["https://example.com/gallery/1.png"],
          social_links: [{ platform: "Instagram", url: "https://instagram.com/420ent" }],
        });
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { getEventBySlug } from "@/lib/supabase/events";

describe("getEventBySlug", () => {
  it("includes the organizer's bio, gallery, and social links", async () => {
    const result = await getEventBySlug("my-event");
    expect(result?.organizer.bio).toBe("The organizer's real bio.");
    expect(result?.organizer.gallery_urls).toEqual(["https://example.com/gallery/1.png"]);
    expect(result?.organizer.social_links).toEqual([
      { platform: "Instagram", url: "https://instagram.com/420ent" },
    ]);
  });
});
