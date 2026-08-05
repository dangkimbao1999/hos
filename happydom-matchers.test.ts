import { describe, expect, it } from "bun:test";

// happydom-matchers.ts is a bun:test preload script (see bunfig.toml's
// `[test] preload`) that extends bun:test's `expect` with jest-dom's DOM
// matchers. This is a regression test for that extension actually taking
// effect — it must run *after* happydom.ts has registered `document`
// (guaranteed by preload array order), and it exercises a real jest-dom
// matcher against a real DOM node rather than re-asserting internals.
describe("happydom-matchers preload", () => {
  it("extends expect with jest-dom matchers like toBeInTheDocument", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    document.body.removeChild(el);
    expect(el).not.toBeInTheDocument();
  });
});
