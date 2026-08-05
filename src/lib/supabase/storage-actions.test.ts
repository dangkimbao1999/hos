import { describe, expect, it, mock } from "bun:test";

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

import { removeGalleryImage, uploadCover, uploadGalleryImage } from "@/lib/supabase/storage-actions";

describe("storage actions — signed-out guard", () => {
  it("uploadCover rejects when not signed in", async () => {
    expect(await uploadCover(new FormData())).toEqual({ error: "You must be signed in." });
  });

  it("uploadGalleryImage rejects when not signed in", async () => {
    expect(await uploadGalleryImage(new FormData())).toEqual({ error: "You must be signed in." });
  });

  it("removeGalleryImage rejects when not signed in", async () => {
    expect(await removeGalleryImage(new FormData())).toEqual({ error: "You must be signed in." });
  });
});
