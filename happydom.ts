import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Registration must happen in its own preload module, with no other
// imports, and must run *before* `happydom-matchers.ts` (see bunfig.toml's
// `[test] preload` array order). `@testing-library/dom`'s `screen`
// singleton is computed once, at module-evaluation time, from
// `typeof document !== "undefined" && document.body` — if that module gets
// evaluated (e.g. transitively, via jest-dom's matchers) before this
// `register()` call runs, `screen` is permanently bound to a stub that
// throws on every query, even after `document` exists. Static `import`s
// are hoisted above a file's own statements, so keeping the jest-dom
// matchers import out of this file (and out of anything imported here) is
// what guarantees the ordering.
GlobalRegistrator.register();
