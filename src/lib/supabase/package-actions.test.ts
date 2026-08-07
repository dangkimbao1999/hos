import { describe, expect, it, mock } from "bun:test";

mock.module("next/cache", () => ({ revalidatePath: () => {} }));

const USER_ID = "11111111-1111-1111-1111-111111111111";

function makeSupabase(options: { user: { id: string } | null; kycStatus?: string }) {
  const inserted: { packages?: Record<string, unknown> } = {};
  const updated: { packages?: Record<string, unknown> } = {};

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
      if (table === "packages") {
        return {
          insert: async (row: Record<string, unknown>) => {
            inserted.packages = row;
            return { error: null };
          },
          update: (row: Record<string, unknown>) => {
            updated.packages = row;
            return { eq: () => ({ eq: async () => ({ error: null }) }) };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    __inserted: inserted,
    __updated: updated,
  };
}

let supabaseMock = makeSupabase({ user: { id: USER_ID } });

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => supabaseMock,
}));

import {
  acceptBooking,
  addToCart,
  checkoutCart,
  createPackage,
  deletePackage,
  rejectBooking,
  removeFromCart,
  updatePackage,
} from "@/lib/supabase/package-actions";

function packageFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("categoryId", "22222222-2222-2222-2222-222222222222");
  formData.set("subcategoryId", "33333333-3333-3333-3333-333333333333");
  formData.set("title", "Acoustic Set");
  formData.set("cityId", "44444444-4444-4444-4444-444444444444");
  formData.set("repeatOn", "false");
  formData.set("startDate", "2026-09-01");
  formData.set("endDate", "2026-09-01");
  formData.set("startTime", "20:00");
  formData.set("endTime", "22:00");
  formData.set("priceMin", "1000000");
  formData.set("priceMax", "2000000");
  formData.set("paymentMethod", "Prepaid");
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

describe("package actions — signed-out guard", () => {
  it("createPackage rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await createPackage(packageFormData())).toEqual({ error: "You must be signed in." });
  });

  it("updatePackage rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await updatePackage("pkg-1", packageFormData())).toEqual({ error: "You must be signed in." });
  });

  it("deletePackage rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await deletePackage("pkg-1")).toEqual({ error: "You must be signed in." });
  });

  it("addToCart rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await addToCart(new FormData())).toEqual({ error: "You must be signed in." });
  });

  it("removeFromCart rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await removeFromCart("cart-1")).toEqual({ error: "You must be signed in." });
  });

  it("checkoutCart rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await checkoutCart(new FormData())).toEqual({ error: "You must be signed in." });
  });

  it("acceptBooking rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await acceptBooking("booking-1")).toEqual({ error: "You must be signed in." });
  });

  it("rejectBooking rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await rejectBooking("booking-1")).toEqual({ error: "You must be signed in." });
  });
});

describe("createPackage / updatePackage", () => {
  it("persists category_id/subcategory_id/city_id from the submitted lookup ids", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    const result = await createPackage(packageFormData());
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__inserted.packages).toMatchObject({
      category_id: "22222222-2222-2222-2222-222222222222",
      subcategory_id: "33333333-3333-3333-3333-333333333333",
      city_id: "44444444-4444-4444-4444-444444444444",
    });
  });

  it("updates category_id/subcategory_id/city_id from the submitted lookup ids", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    const result = await updatePackage("pkg-1", packageFormData({ subcategoryId: "" }));
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__updated.packages).toMatchObject({
      category_id: "22222222-2222-2222-2222-222222222222",
      subcategory_id: null,
      city_id: "44444444-4444-4444-4444-444444444444",
    });
  });
});
