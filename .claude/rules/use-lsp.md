# Prefer LSP for Code Navigation

Use LSP operations for code intelligence instead of grep/read. LSP
understands code semantically (types, scopes, call graphs) — grep only
matches text patterns.

## When to use LSP

- **Finding definitions**: `goToDefinition` — not `grep "function foo"`
- **Finding all callers/usages**: `findReferences` — not `grep "foo("`
- **Checking types or signatures**: `hover` — not reading the whole file
- **Tracing call chains**: `incomingCalls` / `outgoingCalls`
- **Finding interface implementations**: `goToImplementation`
- **Listing symbols in a file**: `documentSymbol`
- **Searching symbols across repo**: `workspaceSymbol`
- **Before refactoring**: use `findReferences` to find all usages before
  renaming or modifying
- **After editing**: use `hover` to verify types are correct

## When grep/read is still appropriate

- Searching for string literals, config values, i18n keys, or non-code
  patterns
- Reading a file you're about to edit (required by Edit tool)
- Searching across file types LSP doesn't cover (JSON, YAML, SQL, Markdown)
- Simple one-off searches where you know the exact filename/pattern

## Rule

Always reach for LSP first when navigating code in a language with LSP
support. Fall back to grep only when LSP can't help.
