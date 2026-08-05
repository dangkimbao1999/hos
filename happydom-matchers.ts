import { expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";

// Must load *after* happydom.ts in bunfig.toml's `[test] preload` array —
// this is what first evaluates @testing-library/dom (a transitive
// dependency of jest-dom's matchers), and it must see `document` already
// registered. See the comment in happydom.ts for why.
expect.extend(matchers);
