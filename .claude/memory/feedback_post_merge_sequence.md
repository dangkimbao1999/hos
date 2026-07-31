---
name: feedback-post-merge-sequence
description: After a PR merges, execute the mandatory post-merge sequence (ExitWorktree → check-codebuild) WITHOUT asking for confirmation. The project rules already authorize it.
metadata:
  type: feedback
---

When a PR merges (whether via `gh pr merge`, force-merge-pr, or an external merge detected via `gh pr view`), execute the rule-prescribed post-merge sequence immediately and without asking:

1. `ExitWorktree(action: "remove", discard_changes: <by-strategy>)` — see `.claude/rules/post-merge-worktree-cleanup.md`
2. Load `check-codebuild` skill if deploy-triggering paths changed (gateway/, cosmo/, platform/, agents/shared/, lockfiles). Skip when only `.claude/`, `docs/`, `e2e/`, `hasura/metadata/`, or `sdks/` (non-demo) changed. See `.claude/rules/check-codebuild.md`.

`discard_changes` by merge strategy (from `.claude/rules/post-merge-worktree-cleanup.md`):
- `--squash` (default for Banyan) → `true`
- `--rebase` → `true`
- `--merge` → `false`

**Why:** `.claude/rules/post-merge-worktree-cleanup.md` labels the action "Mandatory" and "pre-authorized". That phrasing is the project's standing authorization. The general system-prompt heuristic ("ask before destructive actions") DOES NOT apply when:
1. A project rule names the action explicitly, AND
2. The rule supplies the parameters (so no judgment is delegated), AND
3. The action is recoverable in principle (squashed commits live on main; the worktree is just a working copy — see the "Why post-merge cleanup is safe" section of the rule).

**How to apply:** The signal phrases "mandatory" / "not optional" / "pre-authorized" / "load-bearing" in any Banyan rule mean: don't ask, just execute. Asking turns the rule into a suggestion and creates a 10-minute window where the merge-marker auto-approval expires, forcing the engineer to click through a permission prompt later.

**Incident:** 2026-05-20 session — PR #1426 merged externally, I detected the merge via `gh pr view` but then asked "Want me to do that now?" before calling ExitWorktree. User pushed back: "why you not exit and clean-up the worktree?" That ask added friction the rule was written to prevent. Same session also surfaced a content/naming mismatch: the worktree-cleanup discipline was buried in `check-codebuild.md` despite being a separate concern — split into its own rule file `post-merge-worktree-cleanup.md`.

Related: [[feedback_exit_worktree_tool]], [[project_deployment]]
