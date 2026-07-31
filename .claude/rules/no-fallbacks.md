# No Fallbacks — Fail Fast, Fail Loud

NEVER implement fallback solutions. Fallbacks mask root causes, propagate
broken state silently, and cause catastrophic failures that are impossible
to troubleshoot.

## Banned patterns

- `catch` blocks that swallow errors and return a degraded/default value
- `?? defaultValue` or `|| fallback` to paper over missing data
- "Fall back to text-only" / "Fall back to basic mode" / "Try X, if that
  fails try Y"
- `try { preferredApproach() } catch { inferiorAlternative() }` — cascading
  try/catch
- Optional chaining `?.` used to silently skip broken paths instead of
  fixing them
- NULL/undefined as a "safe" substitute for a value that should exist
- Returning partial/empty results when the real operation failed

## Required patterns

- **Fail fast** — if something is wrong, throw immediately. Don't limp
  along.
- **Fail loud** — errors must surface clearly with actionable context. No
  silent swallowing.
- **Fix the root cause** — if an operation can fail, understand WHY and
  prevent it. Don't wrap it in try/catch with a "good enough" alternative.
- **Validate inputs early** — check preconditions at the boundary, reject
  bad data before it propagates.
- **Let errors crash** — an unhandled error that crashes visibly is
  infinitely better than a fallback that silently corrupts state for hours.

## The only acceptable catch blocks

- **Retry with backoff** for genuinely transient errors (network timeout,
  rate limit) — but retry the SAME operation, never a different one.
- **User-facing error display** — catch at the UI boundary to show an error
  message, but NEVER silently degrade the UI to hide the failure.
- **Cleanup/resource release** — catch to close connections or release
  locks, then RE-THROW.

A `.claude/hooks/no-fallbacks-guard.sh` PreToolUse hook heuristically scans
new Edit/Write content for a subset of these patterns and blocks on match.
It's a narrow regex-based net, not a substitute for review — tighten it as
you find real violations it misses, or false positives it over-triggers on.
