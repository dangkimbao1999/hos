#!/usr/bin/env bash
# PreToolUse hook for Bash — forces `gh pr create` to default to --draft.
#
# Why: PRs without the GitHub "Draft" badge can be accidentally merged by
# reviewers before the author has finished coding/tests/review responses.
# A draft PR is the safe default; promotion to "ready for review" is an
# explicit, deliberate step (`gh pr ready <pr>`).
#
# Behaviour:
#   - Allow:  any `gh pr create` invocation that contains `--draft`.
#   - Block:  `gh pr create` without `--draft` (exit 2 + stderr message).
#   - Bypass: set PROJECT_PR_NON_DRAFT=1, or prefix the command inline —
#             use ONLY when the human explicitly told you to ship a
#             non-draft PR in this turn ("ship it", "merge this now").
#
# Registered with `if: Bash(gh pr create*)` in .claude/settings.json.

set -uo pipefail

# Resolve a usable python interpreter. On some Windows/Git Bash setups,
# `python3` on PATH is a broken Microsoft Store alias stub that exits
# non-zero instead of running Python — detect that and fall back to
# `python` (e.g. a real conda/venv install) so JSON parsing below does
# not silently no-op.
PY=python3
if ! command -v python3 >/dev/null 2>&1 || ! python3 -c "pass" >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1 && python -c "pass" >/dev/null 2>&1; then
    PY=python
  fi
fi

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | "$PY" -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('command', ''))" 2>/dev/null || printf '')

if [ -z "$COMMAND" ]; then
  exit 0
fi

if [ "${PROJECT_PR_NON_DRAFT:-0}" = "1" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -qE '(^|[[:space:]]|;|&&|\|\|)PROJECT_PR_NON_DRAFT=1[[:space:]]+gh[[:space:]]+pr[[:space:]]+create([[:space:]]|$)'; then
  exit 0
fi

if ! echo "$COMMAND" | grep -qE '(^|[[:space:]]|;|&&|\|\|)gh[[:space:]]+pr[[:space:]]+create([[:space:]]|$)'; then
  exit 0
fi

if echo "$COMMAND" | grep -qE '(^|[[:space:]])--draft([[:space:]=]|$)'; then
  exit 0
fi

cat >&2 <<'MSG'
ERROR: Default to draft PRs.

`gh pr create` must include `--draft`. Open every PR as a draft so
reviewers don't merge work that isn't finished yet (coding, tests, review
feedback). Promote to ready-for-review with `gh pr ready <pr-number>` only
when ALL of these are true:

  1. All coding tasks are done.
  2. Typecheck + relevant tests pass.
  3. All requested review changes have been addressed.
  4. The PR description accurately reflects what's in the diff.

Retry with `--draft` appended, e.g.:
  gh pr create --draft --title "..." --body "..."

Explicit override (one-off non-draft PR), only when the human explicitly
told you to ship a non-draft PR in this turn:
  PROJECT_PR_NON_DRAFT=1 gh pr create ...
MSG
exit 2
