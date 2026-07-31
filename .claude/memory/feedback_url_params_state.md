---
name: URL params for UI state
description: All selectable UI state (tabs, selected items, filters) must persist in URL search params so refresh preserves state.
type: feedback
---

All selectable UI state must be synced with URL search params — not useState alone.

**Why:** The user expects refresh to preserve what they're looking at. useState resets on refresh, losing context. URL params also enable deep-linking and sharing.

**How to apply:** When adding tabs, selected items, filters, or any user-selectable state in platform UI:
- Use `useSearchParams` from react-router-dom
- Sync state to/from URL params with `{ replace: true }`
- Examples: `?tab=reference-data`, `?file=drug-reference.csv`, `?country=thailand`
