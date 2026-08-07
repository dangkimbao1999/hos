import { describe, expect, it } from "bun:test";
import { parseEventPhotoPaths } from "@/lib/supabase/event-photo-validation";

const USER_ID = "11111111-1111-1111-1111-111111111111";

describe("parseEventPhotoPaths", () => {
  it("accepts up to ten unique photos owned by the current user", () => {
    const path = `${USER_ID}/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp`;
    expect(parseEventPhotoPaths(JSON.stringify([path, path]), USER_ID)).toEqual({ paths: [path] });
  });

  it("rejects photos outside the current user's event folder", () => {
    expect(
      parseEventPhotoPaths(
        JSON.stringify(["22222222-2222-2222-2222-222222222222/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp"]),
        USER_ID
      )
    ).toEqual({ error: "Invalid event photos." });
  });

  it("rejects more than ten photos", () => {
    const paths = Array.from(
      { length: 11 },
      (_, i) => `${USER_ID}/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa${i}.webp`
    );
    expect(parseEventPhotoPaths(JSON.stringify(paths), USER_ID)).toEqual({
      error: "You can upload at most 10 event photos.",
    });
  });
});
