import { describe, expect, it, mock } from "bun:test";

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

import { updateProfile } from "@/lib/supabase/profile-actions";

describe("updateProfile — signed-out guard", () => {
  it("rejects when not signed in", async () => {
    const formData = new FormData();
    formData.set("fullName", "Test User");
    expect(await updateProfile(formData)).toEqual({ error: "You must be signed in." });
  });
});
