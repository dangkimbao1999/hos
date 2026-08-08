import { afterEach, describe, expect, it, mock } from "bun:test";

const revalidatePath = mock(() => {});
mock.module("next/cache", () => ({ revalidatePath }));

const USER_ID = "11111111-1111-1111-1111-111111111111";

const TALENT_ID = "22222222-2222-2222-2222-222222222222";
const ORGANIZER_ID = "33333333-3333-3333-3333-333333333333";

interface FakeBooking {
  organizer_id: string;
  awaiting_response_from: "talent" | "organizer" | null;
  talent_offer_vnd: number;
  organizer_offer_vnd: number;
  talent_id: string;
}

function makeSupabase(options: {
  user: { id: string } | null;
  kycStatus?: string;
  booking?: FakeBooking;
}) {
  const inserted: { packages?: Record<string, unknown>; cart_items?: Record<string, unknown> } = {};
  const updated: { packages?: Record<string, unknown>; package_bookings?: Record<string, unknown> } = {};

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
      if (table === "cart_items") {
        return {
          insert: async (row: Record<string, unknown>) => {
            inserted.cart_items = row;
            return { error: null };
          },
        };
      }
      if (table === "package_bookings") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: options.booking
                  ? {
                      organizer_id: options.booking.organizer_id,
                      awaiting_response_from: options.booking.awaiting_response_from,
                      talent_offer_vnd: options.booking.talent_offer_vnd,
                      organizer_offer_vnd: options.booking.organizer_offer_vnd,
                      package: { talent_id: options.booking.talent_id },
                    }
                  : null,
              }),
            }),
          }),
          update: (row: Record<string, unknown>) => {
            updated.package_bookings = row;
            return { eq: async () => ({ error: null }) };
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
  addToCart,
  checkoutCart,
  confirmBookingOffer,
  createPackage,
  deletePackage,
  rejectBooking,
  removeFromCart,
  submitCounterOffer,
  updatePackage,
} from "@/lib/supabase/package-actions";

afterEach(() => {
  revalidatePath.mockClear();
});

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

  it("confirmBookingOffer rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await confirmBookingOffer("booking-1")).toEqual({ error: "You must be signed in." });
  });

  it("submitCounterOffer rejects when not signed in", async () => {
    supabaseMock = makeSupabase({ user: null });
    expect(await submitCounterOffer("booking-1", new FormData())).toEqual({ error: "You must be signed in." });
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

  it("persists working method/skill tags, splitting skill tags on comma", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    const result = await createPackage(
      packageFormData({ workingMethod: "Freelance", skillTags: "Guitar, Vocals ,  Piano" })
    );
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__inserted.packages).toMatchObject({
      working_method: "Freelance",
      skill_tags: ["Guitar", "Vocals", "Piano"],
    });
  });

  it("stores null working method and an empty skill_tags array when omitted", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    await createPackage(packageFormData());
    expect(supabaseMock.__inserted.packages).toMatchObject({
      working_method: null,
      skill_tags: [],
    });
  });
});

describe("confirmBookingOffer", () => {
  it("accepts the organizer's offer when it's the talent's turn, setting price_vnd and clearing the turn", async () => {
    supabaseMock = makeSupabase({
      user: { id: TALENT_ID },
      booking: {
        organizer_id: ORGANIZER_ID,
        talent_id: TALENT_ID,
        awaiting_response_from: "talent",
        talent_offer_vnd: 5_000_000,
        organizer_offer_vnd: 4_500_000,
      },
    });
    const result = await confirmBookingOffer("booking-1");
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__updated.package_bookings).toEqual({
      status: "confirmed",
      price_vnd: 4_500_000,
      awaiting_response_from: null,
    });
  });

  it("accepts the talent's offer when it's the organizer's turn", async () => {
    supabaseMock = makeSupabase({
      user: { id: ORGANIZER_ID },
      booking: {
        organizer_id: ORGANIZER_ID,
        talent_id: TALENT_ID,
        awaiting_response_from: "organizer",
        talent_offer_vnd: 5_000_000,
        organizer_offer_vnd: 4_500_000,
      },
    });
    const result = await confirmBookingOffer("booking-1");
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__updated.package_bookings).toMatchObject({ price_vnd: 5_000_000 });
  });

  it("rejects when it isn't the caller's turn", async () => {
    supabaseMock = makeSupabase({
      user: { id: TALENT_ID },
      booking: {
        organizer_id: ORGANIZER_ID,
        talent_id: TALENT_ID,
        awaiting_response_from: "organizer",
        talent_offer_vnd: 5_000_000,
        organizer_offer_vnd: 4_500_000,
      },
    });
    expect(await confirmBookingOffer("booking-1")).toEqual({ error: "It's not your turn to respond to this offer." });
  });

  it("rejects when the caller isn't part of the booking", async () => {
    supabaseMock = makeSupabase({
      user: { id: "44444444-4444-4444-4444-444444444444" },
      booking: {
        organizer_id: ORGANIZER_ID,
        talent_id: TALENT_ID,
        awaiting_response_from: "talent",
        talent_offer_vnd: 5_000_000,
        organizer_offer_vnd: 4_500_000,
      },
    });
    expect(await confirmBookingOffer("booking-1")).toEqual({ error: "You are not part of this booking." });
  });
});

describe("submitCounterOffer", () => {
  it("sets the talent's new offer and flips the turn to the organizer", async () => {
    supabaseMock = makeSupabase({
      user: { id: TALENT_ID },
      booking: {
        organizer_id: ORGANIZER_ID,
        talent_id: TALENT_ID,
        awaiting_response_from: "talent",
        talent_offer_vnd: 5_000_000,
        organizer_offer_vnd: 4_500_000,
      },
    });
    const formData = new FormData();
    formData.set("offerVnd", "6000000");
    const result = await submitCounterOffer("booking-1", formData);
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__updated.package_bookings).toEqual({
      talent_offer_vnd: 6_000_000,
      awaiting_response_from: "organizer",
      status: "dealing",
    });
  });

  it("sets the organizer's new offer and flips the turn to the talent", async () => {
    supabaseMock = makeSupabase({
      user: { id: ORGANIZER_ID },
      booking: {
        organizer_id: ORGANIZER_ID,
        talent_id: TALENT_ID,
        awaiting_response_from: "organizer",
        talent_offer_vnd: 5_000_000,
        organizer_offer_vnd: 4_500_000,
      },
    });
    const formData = new FormData();
    formData.set("offerVnd", "4800000");
    const result = await submitCounterOffer("booking-1", formData);
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__updated.package_bookings).toEqual({
      organizer_offer_vnd: 4_800_000,
      awaiting_response_from: "talent",
      status: "dealing",
    });
  });

  it("rejects a non-positive offer amount", async () => {
    supabaseMock = makeSupabase({
      user: { id: TALENT_ID },
      booking: {
        organizer_id: ORGANIZER_ID,
        talent_id: TALENT_ID,
        awaiting_response_from: "talent",
        talent_offer_vnd: 5_000_000,
        organizer_offer_vnd: 4_500_000,
      },
    });
    const formData = new FormData();
    formData.set("offerVnd", "0");
    expect(await submitCounterOffer("booking-1", formData)).toEqual({ error: "Enter a valid offer amount." });
  });

  it("rejects when it isn't the caller's turn", async () => {
    supabaseMock = makeSupabase({
      user: { id: TALENT_ID },
      booking: {
        organizer_id: ORGANIZER_ID,
        talent_id: TALENT_ID,
        awaiting_response_from: "organizer",
        talent_offer_vnd: 5_000_000,
        organizer_offer_vnd: 4_500_000,
      },
    });
    const formData = new FormData();
    formData.set("offerVnd", "6000000");
    expect(await submitCounterOffer("booking-1", formData)).toEqual({
      error: "It's not your turn to respond to this offer.",
    });
  });
});

describe("rejectBooking", () => {
  it("cancels the booking and clears the pending turn", async () => {
    supabaseMock = makeSupabase({ user: { id: TALENT_ID } });
    const result = await rejectBooking("booking-1");
    expect(result).toEqual({ success: true });
    expect(supabaseMock.__updated.package_bookings).toEqual({
      status: "cancelled",
      awaiting_response_from: null,
    });
  });
});

describe("addToCart", () => {
  function cartFormData(overrides: Record<string, string> = {}): FormData {
    const formData = new FormData();
    formData.set("packageId", "pkg-1");
    formData.set("priceVnd", "1000000");
    formData.set("cityId", "city-hcm");
    formData.set("address", "123 Main St");
    for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
    return formData;
  }

  it("revalidates the organizer layout so the cart badge/dropdown refresh on the next navigation", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    const result = await addToCart(cartFormData());

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/organizer", "layout");
  });

  it("requires a perform city", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(await addToCart(cartFormData({ cityId: "" }))).toEqual({ error: "Select the perform city." });
  });

  it("requires a perform address", async () => {
    supabaseMock = makeSupabase({ user: { id: USER_ID } });
    expect(await addToCart(cartFormData({ address: "" }))).toEqual({ error: "Enter the perform address." });
  });
});
