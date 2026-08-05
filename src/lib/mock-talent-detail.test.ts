import { describe, expect, it } from "bun:test";
import { mockTalentDetail } from "@/lib/mock-talent-detail";

describe("mockTalentDetail", () => {
  it("does not expose a dead services field", () => {
    expect(mockTalentDetail).not.toHaveProperty("services");
  });

  it("still provides the fields the talent detail hero/tagline/bio fall back to", () => {
    expect(mockTalentDetail.tagline).toBeTruthy();
    expect(mockTalentDetail.bio).toBeTruthy();
    expect(mockTalentDetail.category).toBeTruthy();
  });
});
