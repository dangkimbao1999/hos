import { describe, expect, it } from "bun:test";
import { parseAchievements, parseServices, parseSocialLinks } from "@/lib/supabase/profile-parsing";

describe("parseSocialLinks", () => {
  it("drops rows missing a platform or url", () => {
    const raw = JSON.stringify([
      { platform: "Instagram", url: "https://instagram.com/x" },
      { platform: "", url: "https://example.com" },
      { platform: "Facebook", url: "  " },
    ]);
    expect(parseSocialLinks(raw)).toEqual([{ platform: "Instagram", url: "https://instagram.com/x" }]);
  });

  it("trims whitespace", () => {
    const raw = JSON.stringify([{ platform: " Instagram ", url: " https://instagram.com/x " }]);
    expect(parseSocialLinks(raw)).toEqual([{ platform: "Instagram", url: "https://instagram.com/x" }]);
  });

  it("returns null for malformed JSON", () => {
    expect(parseSocialLinks("not json")).toBeNull();
  });

  it("returns null when the JSON isn't an array", () => {
    expect(parseSocialLinks(JSON.stringify({ platform: "Instagram" }))).toBeNull();
  });
});

describe("parseAchievements", () => {
  it("drops rows missing a title", () => {
    const raw = JSON.stringify([
      { title: "2023 Nominee - BET Award", subtitle: "Video Director of the Year" },
      { title: "  ", subtitle: "no title" },
    ]);
    expect(parseAchievements(raw)).toEqual([
      { title: "2023 Nominee - BET Award", subtitle: "Video Director of the Year" },
    ]);
  });

  it("keeps a row with an empty subtitle", () => {
    const raw = JSON.stringify([{ title: "Award", subtitle: "" }]);
    expect(parseAchievements(raw)).toEqual([{ title: "Award", subtitle: "" }]);
  });

  it("returns null for malformed JSON", () => {
    expect(parseAchievements("not json")).toBeNull();
  });
});

describe("parseServices", () => {
  it("trims and drops empty entries", () => {
    const raw = JSON.stringify([" DJ Sets ", "", "  "]);
    expect(parseServices(raw)).toEqual(["DJ Sets"]);
  });

  it("returns null for malformed JSON", () => {
    expect(parseServices("not json")).toBeNull();
  });
});
