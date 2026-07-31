---
name: Audit every technical term before using it
description: Never use sloppy, ambiguous, or made-up technical terms. If a term doesn't precisely describe what it labels — including the scope it implies — find the right term or describe the mechanism in plain words. Specify ambiguous qualifiers like "shared", "local", "common" with their exact scope.
type: feedback
---

# Audit every technical term before using it

Before using any technical term — in code, commit messages, PR descriptions, design docs, or live conversation — confirm that:

1. The term **correctly describes the mechanism** (not just sounds vaguely related)
2. The term's **implied scope is unambiguous** to a reader who hasn't seen the code

If either check fails, either find the right term or describe the mechanism in plain words with explicit scope.

**Why:** Repeated incidents in the 2026-05-13 session, each costing a clarification round:

1. **"Re-ranker"** for what was actually an address-overlap filter (filter narrows; re-ranker reorders by score — distinct mechanisms).
2. **"Ungated"** for a change that removed a count-based gate but left a presence-of-address guard in place. The filter still has a guard; only the count restriction was removed.
3. **"Symmetric"** without qualification for tiers that are *compositionally mirrored* on success but *asymmetric on failure handling* (Tier 1 escalates, Tier 2 degrades).
4. **"Shared"** (in `"the shared GraphQL query template used limit: 10"`) without specifying the scope of sharing. A reader could reasonably interpret as `agents/shared/`, shared across tools, shared across files, or — what I meant — shared across the four tier call-sites within one function. The ambiguity inflated a single-file change into an apparent architectural concern.

Each of these was an almost-but-not-quite-right term that survived because I didn't run the self-check the memory itself prescribes.

**How to apply:**

- **Run the self-check on every technical term.** Before sending a paragraph, re-read every noun naming a mechanism, pattern, or scope. Ask: does this word correctly describe what it labels?
- **Ambiguous qualifiers must specify scope.** Words like "shared", "common", "local", "global", "scoped" must come with explicit scope — across what?
  - "the shared LIMIT" → "the LIMIT in the four-tier-shared query template inside `searchMedicalProvider`"
  - "local helper" → "helper local to `agents/claim-creator/tools/search.ts`"
  - "global config" → "config exported from `gateway/src/config.ts`, read by every route"
- **Prefer mechanism-description over jargon when in doubt.** "An address-overlap filter that runs before name ranking" beats "an address-overlap step" beats "a re-ranker". The longer phrase is unambiguous; the shorter ones depend on shared mental models that may not exist.
- **Never invent terminology.** If no established term fits, describe the mechanism plainly. Don't borrow a term from a related-but-different concept.
- **After drafting any technical paragraph, re-read every noun that names a mechanism, pattern, or scope.** Confirm each is the right name AND that its implied scope matches the actual scope. Revise if either is off.
- **Apply this discipline to commit messages and PR descriptions especially.** Those live in the codebase forever and get read by people who have no session context. An ambiguous "shared" in a PR body persists as a misleading record long after the slack thread that would have clarified it is gone.
