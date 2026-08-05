<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Running tests

Always run tests via `bun run test` or `bun test --isolate` — never bare `bun test`. Without `--isolate`, Bun's `mock.module()` leaks mocked modules across test files (a documented Bun limitation), causing spurious failures unrelated to your changes.
