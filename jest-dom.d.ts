import type { expect } from "bun:test";
import type matchers from "@testing-library/jest-dom/matchers";

// bun:test's `expect` doesn't know about jest-dom's matchers (toBeInTheDocument,
// etc.) out of the box. jest-dom ships this exact declaration merge at
// `@testing-library/jest-dom/types/bun.d.ts`, but that path isn't exposed
// through the package's "exports" map, so it never gets pulled into this
// project's TS program. Re-declaring it here (sourcing the real matcher
// types from the public "./matchers" export subpath) is the supported
// workaround. See happydom-matchers.ts for where the matchers are actually
// registered onto `expect` at runtime.
export {};
declare module "bun:test" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<T = unknown>
    extends matchers.TestingLibraryMatchers<ReturnType<typeof expect.stringContaining>, T> {}
}
