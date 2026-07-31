#!/usr/bin/env bash
# linear-session-start.sh — fires SessionStart.
#
# NUDGE ONLY — this hook cannot call Linear MCP tools itself (hooks run
# outside the model's tool-call loop). It just checks whether the session
# is linked and, if so, prints a reminder for the model to catch up via
# MCP (get_issue + list_comments) before starting work.
#
# Never blocks session startup.

set -u

ANCHOR="${CLAUDE_PROJECT_DIR:-$PWD}"
TOPLEVEL=$(git -C "$ANCHOR" rev-parse --show-toplevel 2>/dev/null || echo "$ANCHOR")
LINK_FILE="$TOPLEVEL/.claude/.linear-link"

[ -f "$LINK_FILE" ] || exit 0

ISSUE=$(tr -d '[:space:]' < "$LINK_FILE" 2>/dev/null)
[ -z "$ISSUE" ] && exit 0

cat <<EOM
{"systemMessage": "This session is linked to Linear issue ${ISSUE}. Before starting work, call the Linear MCP get_issue + list_comments tools for ${ISSUE} to catch up on any decisions made since last session."}
EOM

exit 0
