# PR Quality Nudge

When `gh pr create` succeeds, the `pr-created-agents.sh` PostToolUse hook
prints a self-review reminder. This is intentionally minimal in a fresh
project.

## Growing this rule

As the project accumulates real domain-specific review concerns (i18n
completeness, structured logging compliance, migration safety, performance
budgets, ...), follow this pattern (matches the reference project this
template was cloned from):

1. Write a dedicated rule file per concern (e.g.
   `.claude/rules/logging-enforcement.md`) with a clear "what to check" list.
2. Optionally back it with a sub-agent (`.claude/agents/<name>.md`) that can
   scan a PR diff and fix violations.
3. Update `pr-created-agents.sh` to gate which agent(s) it nudges based on
   the PR's changed-file list (`gh pr diff <N> --name-only`), so an agent
   whose surface isn't in the diff never gets spawned for nothing.
4. List the new rule under CLAUDE.md's "Code Review Extended Rules" section.

## Load this rule when

- Deciding whether a new PR-time enforcement concern needs a rule, a hook,
  or a sub-agent (or all three).

## Skip when

- The PR quality nudge is already firing correctly and no new concern is
  being added.
