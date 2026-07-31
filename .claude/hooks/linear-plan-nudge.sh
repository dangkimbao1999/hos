#!/usr/bin/env bash
# linear-plan-nudge.sh — fires PostToolUse on ExitPlanMode.
#
# NUDGE ONLY (see linear-session-start.sh for why). If the session is
# linked to a Linear issue, remind the model to post the just-approved
# plan as a comment via the Linear MCP tool.

set -u

cat >/dev/null 2>&1 || true

ANCHOR="${CLAUDE_PROJECT_DIR:-$PWD}"
TOPLEVEL=$(git -C "$ANCHOR" rev-parse --show-toplevel 2>/dev/null || echo "$ANCHOR")
LINK_FILE="$TOPLEVEL/.claude/.linear-link"

[ -f "$LINK_FILE" ] || exit 0

ISSUE=$(tr -d '[:space:]' < "$LINK_FILE" 2>/dev/null)
[ -z "$ISSUE" ] && exit 0

echo "Reminder: session is linked to Linear issue ${ISSUE} — post the plan you just approved as a comment via the Linear MCP tool (e.g. save_comment) now." >&2

exit 0
