#!/usr/bin/env bash
# pr-created-agents.sh — fires PostToolUse on Bash. When `gh pr create`
# succeeds, nudges Claude Code to self-review the PR before handing it to a
# human reviewer.
#
# CUSTOMIZE: as your project grows real domain-specific review agents
# (i18n checker, logging-compliance checker, migration-safety checker, ...),
# gate them here the way .claude/rules/pr-quality-agents.md (in the
# reference project this template was cloned from) does: read the PR's
# changed-file list and only nudge the agents whose review surface is
# actually touched.

set -u

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

COMMAND=$(echo "$INPUT" | "$PY" -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

if ! echo "$COMMAND" | grep -qE 'gh[[:space:]]+pr[[:space:]]+create'; then
  exit 0
fi

EXIT_CODE=$(echo "$INPUT" | "$PY" -c "
import sys, json
d = json.load(sys.stdin)
out = d.get('tool_output', {})
if isinstance(out, dict):
    print(out.get('exit_code', out.get('returncode', 0)))
else:
    print(0)
" 2>/dev/null || echo "0")

if [ "$EXIT_CODE" != "0" ]; then
  exit 0
fi

cat <<'EOM'
PR created. Before asking for human review, consider self-reviewing:
  - Run your typecheck + test suite one more time on the diff.
  - Re-read .claude/rules/*.md and confirm the diff doesn't violate any of them.
  - If you have the pr-review-toolkit plugin installed, run its review-pr skill.
EOM

exit 0
