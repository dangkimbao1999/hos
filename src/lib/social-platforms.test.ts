import { describe, expect, it } from "bun:test";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";

describe("SOCIAL_PLATFORMS", () => {
  it("includes the platforms called out in the bug report", () => {
    expect(SOCIAL_PLATFORMS).toContain("Instagram");
    expect(SOCIAL_PLATFORMS).toContain("Facebook");
    expect(SOCIAL_PLATFORMS).toContain("SoundCloud");
    expect(SOCIAL_PLATFORMS).toContain("Spotify");
  });

  it("has 11 platforms with no duplicates", () => {
    expect(SOCIAL_PLATFORMS.length).toBe(11);
    expect(new Set(SOCIAL_PLATFORMS).size).toBe(11);
  });
});
