import { describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// happydom.ts is a bun:test preload script (see bunfig.toml's
// `[test] preload`) — by the time any test file runs, it must have already
// registered Happy DOM's globals (document/window/etc). This is a
// regression test for that registration itself; it deliberately does NOT
// call `GlobalRegistrator.register()` again (that would throw, since it's
// already registered by preload).
describe("happydom preload", () => {
  it("registers Happy DOM globally before any test runs", () => {
    expect(GlobalRegistrator.isRegistered).toBe(true);
    expect(typeof document).toBe("object");
    expect(document.body).toBeTruthy();
  });

  it("provides a working document that can create and query elements", () => {
    const el = document.createElement("div");
    el.textContent = "hello";
    document.body.appendChild(el);
    expect(document.body.contains(el)).toBe(true);
    expect(el.textContent).toBe("hello");
    document.body.removeChild(el);
  });
});
