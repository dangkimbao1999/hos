---
name: Fix-scope minimality — behavior, not just text
description: When fixing a bug, optimize for the smallest BEHAVIORAL change first, then make the code change as small as possible given that scope. Text minimality (one line changed) is not the same as behavioral minimality (one path changed).
type: feedback
---

# Fix-scope minimality — optimize behavior, not text

When fixing a bug, the smallest correct change is the one whose behavioral impact equals the bug's behavioral scope — no more, no less. The smallest code-text change is only sometimes the smallest behavioral change. When shared state (constants, helpers, modules) sits between the bug and the code, a one-line text edit can have multi-path behavioral impact.

**Why:** On 2026-05-13, I fixed a bug in `searchMedicalProvider`'s Tier 1 path by bumping a hardcoded `LIMIT 10` to `50` in a single line at `agents/claim-creator/tools/search.ts:600`. The change was 1 line of text but the constant is shared by four tier call-sites (Tier 1 Pass 1, Tier 1 Pass 2, Tier 2, Tier 3). The bug existed only in Tier 1. The fix widened Tier 2 and Tier 3 too — paths the bug didn't affect. The user (Minh) called this a "final straw" rule violation: the fix-scope rule generalizes from `agents/shared/` to ANY shared state, including a constant used by multiple tiers within the same file.

I had even noted the bleed earlier in the same session: *"This single shared query template at line 595-597 has hardcoded `limit: 10`. All four use-sites of this query pass through it. Changing this template changes all four tiers."* Noted, then proceeded anyway. The impact review was performed but treated as descriptive rather than as a gating decision.

**How to apply — before applying any code change:**

1. **Identify the path(s) where the bug actually fires.** Be specific: which tier, which branch, which call site?
2. **Identify the paths the proposed code change affects.** For text changes to shared state (constants, helpers, modules), enumerate every consumer.
3. **Compute the delta.** If the change affects paths the bug doesn't fire on, the change is over-broad.
4. **Decide:** is the bleed acceptable (e.g., the other paths are dead code, or the broader behavior is genuinely wanted) or must the change be narrowed?
5. **If narrowing is needed,** consider: parameterize the shared state via a function parameter or GraphQL variable; introduce a second constant; or refactor the shared logic so each path gets its own knob. The smallest-text change is no longer the right answer once a path-boundary problem is in scope.

**Rule of thumb:** the minimal-text fix and the minimal-behavior fix point at different solutions when shared state is involved. Always optimize for minimal-behavior first, then make the code change as small as possible *given that scope*.

**This rule generalizes the `agent-local-fixes` rule:**
- Across folders: don't touch `agents/shared/` for a single-agent bug
- Across files in the same folder: don't modify helpers if the bug is in one caller
- Across paths in the same file: don't widen a shared constant if only one path is broken
- Across branches in the same function: don't change the if-branch when the bug is in the else-branch

Same principle, different scopes. Apply at every level.
