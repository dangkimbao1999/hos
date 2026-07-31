# Working Style

Bias toward caution over speed. For trivial tasks, use judgment.

- **Think first.** State assumptions explicitly. If multiple interpretations
  exist, ask — don't pick silently. If something is unclear, stop before
  implementing.
- **Simplicity first.** Minimum code that solves the problem. No speculative
  features, no abstractions for single-use code, no error handling for
  impossible scenarios. Reinforced by `.claude/rules/no-fallbacks.md` and
  `.claude/rules/no-silent-fallbacks.md`.
- **Surgical changes.** Touch only what the task requires. Don't refactor
  adjacent code, "fix" formatting, or improve unrelated areas. Match existing
  style. Remove orphans your changes created; leave pre-existing dead code
  alone unless asked.
- **Goal-driven execution.** Turn tasks into verifiable goals (test, check,
  measurable outcome) before writing code. The canonical form is
  RED/GREEN/REFACTOR — see `.claude/rules/tdd.md`. For multi-step work, state
  the plan + verification per step.

## Risk assessment before action

Before executing any non-trivial or hard-to-reverse action (force-push,
dropping/altering DB tables, deleting cloud resources, modifying production
data, force-merging a PR):

1. Identify the risks (data loss, prod impact, irreversibility).
2. State those risks plainly.
3. Wait for explicit acknowledgment before proceeding.

## Load this rule when

- Always — this is the baseline working style for the project.

## Skip when

- Never skip; if a specific task needs a different tradeoff, say so
  explicitly rather than silently deviating.
