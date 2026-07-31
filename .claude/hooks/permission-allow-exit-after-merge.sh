#!/usr/bin/env bash
# permission-allow-exit-after-merge.sh — fires PermissionRequest on
# matcher ExitWorktree.
#
# When post-merge-mark-exit.sh has just dropped a recent marker (the
# operator ran `gh pr merge` successfully within the last 10 minutes),
# emit the auto-approve JSON so Claude Code does not surface a
# permission prompt for ExitWorktree(action="remove").
#
# No-op (silent, exit 0, no output → defer to default permission flow) when:
#   - tool_input.action != "remove" (action="keep" should still confirm)
#   - marker file does not exist
#   - marker file is older than PROJECT_MERGE_MARKER_TTL seconds (default 600)
#   - marker file contents are not a valid epoch integer

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

ACTION=$(echo "$INPUT" | "$PY" -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('action', ''))
" 2>/dev/null || echo "")

if [ "$ACTION" != "remove" ]; then
  exit 0
fi

MARKER="${PROJECT_MERGE_MARKER_FILE:-}"
if [ -z "$MARKER" ]; then
  HASH=$(printf '%s' "${CLAUDE_PROJECT_DIR:-$PWD}" | shasum 2>/dev/null | awk '{print $1}' | cut -c1-16)
  MARKER="/tmp/agentic-template-pending-exit-merge-${HASH:-default}"
fi

if [ ! -f "$MARKER" ]; then
  exit 0
fi

WRITTEN=$(tr -d '[:space:]' < "$MARKER" 2>/dev/null)
if ! [[ "$WRITTEN" =~ ^[0-9]+$ ]]; then
  rm -f "$MARKER"
  exit 0
fi

TTL="${PROJECT_MERGE_MARKER_TTL:-600}"
NOW=$(date +%s)
AGE=$((NOW - WRITTEN))

if [ "$AGE" -lt 0 ] || [ "$AGE" -gt "$TTL" ]; then
  rm -f "$MARKER"
  exit 0
fi

rm -f "$MARKER"
cat <<'EOM'
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}
EOM

exit 0
