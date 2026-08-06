import { beforeEach, describe, expect, it, mock } from "bun:test";

const calls: { type: "error" | "success"; message: string }[] = [];

mock.module("sonner", () => ({
  toast: {
    error: (message: string) => calls.push({ type: "error", message }),
    success: (message: string) => calls.push({ type: "success", message }),
  },
}));

import { runAction } from "@/lib/toast-action";

describe("runAction", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("shows an error toast and returns the result when the action fails", async () => {
    const result = await runAction(Promise.resolve({ error: "Something broke." }), {
      success: "Should not show",
    });
    expect(result).toEqual({ error: "Something broke." });
    expect(calls).toEqual([{ type: "error", message: "Something broke." }]);
  });

  it("shows a success toast when a success message is provided and the action succeeds", async () => {
    const result = await runAction(Promise.resolve({ success: true as const }), {
      success: "It worked.",
    });
    expect(result).toEqual({ success: true });
    expect(calls).toEqual([{ type: "success", message: "It worked." }]);
  });

  it("shows no toast when the action succeeds and no success message is given", async () => {
    const result = await runAction(Promise.resolve({ success: true as const }));
    expect(result).toEqual({ success: true });
    expect(calls).toEqual([]);
  });

  it("passes through extra fields on a successful result unchanged", async () => {
    const result = await runAction(Promise.resolve({ success: true as const, slug: "my-event" }), {
      success: "Event created.",
    });
    expect(result).toEqual({ success: true, slug: "my-event" });
    expect(calls).toEqual([{ type: "success", message: "Event created." }]);
  });
});
