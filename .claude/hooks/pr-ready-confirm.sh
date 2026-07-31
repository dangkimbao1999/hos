#!/usr/bin/env bash
# PreToolUse hook for Bash — forces Claude to ask the human before promoting
# a draft PR to "ready for review".
#
# Behaviour:
#   - Block:  any `gh pr ready …` invocation by default (exit 2 + stderr
#             instruction to ask the user first via AskUserQuestion).
#   - Allow:  re-invocation with PROJECT_PR_READY_CONFIRMED=1 in the env,
#             set AFTER either (a) an AskUserQuestion answer choosing
#             "mark ready", OR (b) the human explicitly instructing
#             promotion in this same turn ("ship it", "merge this PR").
#   - Allow:  `gh pr ready --undo` (ready → draft) always.
#
# Registered with `if: Bash(gh pr ready*)` in .claude/settings.json.

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

if [ "${PROJECT_PR_READY_CONFIRMED:-0}" = "1" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -qE '(^|[[:space:]]|;|&&|\|\|)PROJECT_PR_READY_CONFIRMED=1[[:space:]]+gh[[:space:]]+pr[[:space:]]+ready([[:space:]]|$)'; then
  exit 0
fi

if ! echo "$COMMAND" | grep -qE '(^|[[:space:]]|;|&&|\|\|)gh[[:space:]]+pr[[:space:]]+ready([[:space:]]|$)'; then
  exit 0
fi

if echo "$COMMAND" | grep -qE '(^|[[:space:]])--undo([[:space:]=]|$)'; then
  exit 0
fi

cat >&2 <<'MSG'
ERROR: Confirm with the user before marking a PR ready for review.

`gh pr ready` removes the Draft badge — once it's gone, reviewers may merge
the PR. Even when every coding task looks done, the human may want MORE in
this PR before review starts.

PATH A — you are proposing promotion:
  1. Summarise what's done.
  2. Call AskUserQuestion: "Mark PR #<N> ready, or do more first?"
  3. Only if the user picks "mark ready", re-run with:
       PROJECT_PR_READY_CONFIRMED=1 gh pr ready <pr-number>

PATH B — the human already instructed promotion this turn ("ship it",
"merge this PR", "mark it ready") — go straight to:
  PROJECT_PR_READY_CONFIRMED=1 gh pr ready <pr-number>

Do NOT set the bypass without one of these two confirmation traces.
MSG
exit 2
