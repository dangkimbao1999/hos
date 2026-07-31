#!/usr/bin/env bash
# linear-pr-nudge.sh — fires PostToolUse on Bash. Filters for
# `gh pr create` / `gh pr ready` / `gh pr merge` itself (registered on the
# plain Bash matcher, same pattern as pr-created-agents.sh).
#
# NUDGE ONLY (see linear-session-start.sh for why). If the session is
# linked to a Linear issue, remind the model to update it via the Linear
# MCP tool — comment on create/ready, transition state on merge.

set -u

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

ACTION=""
if echo "$COMMAND" | grep -qE 'gh[[:space:]]+pr[[:space:]]+merge'; then
  ACTION="merge"
elif echo "$COMMAND" | grep -qE 'gh[[:space:]]+pr[[:space:]]+(create|ready)'; then
  ACTION="open"
fi

[ -z "$ACTION" ] && exit 0

EXIT_CODE=$(echo "$INPUT" | python -c "
import sys, json
d = json.load(sys.stdin)
out = d.get('tool_output', {})
print(out.get('exit_code', out.get('returncode', 0)) if isinstance(out, dict) else 0)
" 2>/dev/null || echo "0")

[ "$EXIT_CODE" != "0" ] && exit 0

ANCHOR="${CLAUDE_PROJECT_DIR:-$PWD}"
TOPLEVEL=$(git -C "$ANCHOR" rev-parse --show-toplevel 2>/dev/null || echo "$ANCHOR")
LINK_FILE="$TOPLEVEL/.claude/.linear-link"

[ -f "$LINK_FILE" ] || exit 0

ISSUE=$(tr -d '[:space:]' < "$LINK_FILE" 2>/dev/null)
[ -z "$ISSUE" ] && exit 0

if [ "$ACTION" = "merge" ]; then
  echo "Reminder: session is linked to Linear issue ${ISSUE} — call the Linear MCP save_issue tool to move it to your team's Done-equivalent state." >&2
else
  echo "Reminder: session is linked to Linear issue ${ISSUE} — call the Linear MCP save_comment tool to note the PR URL, and consider save_issue to move it to your team's In-Review-equivalent state." >&2
fi

exit 0
