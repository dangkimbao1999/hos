import { describe, expect, it } from "bun:test";
import { createEventCta } from "@/lib/nav-items";

describe("createEventCta", () => {
  it("has a CTA label for every role", () => {
    expect(createEventCta).toEqual({
      organizer: "Create new Event",
      talent: "Create new Package",
      agency: "Create new Package",
    });
  });
});
