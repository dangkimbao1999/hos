#!/usr/bin/env bash
# serial-worktree-clear.sh — fires PostToolUse on ExitWorktree.
#
# On successful ExitWorktree(action="remove"), deletes:
#   <toplevel>/.claude/sessions/<session_id>/active-work.json
#
# action="keep" preserves the file. Non-zero exit_code is also a no-op.
#
# One outcome line per invocation appended to /tmp/agentic-template-hook.log
# (override via PROJECT_HOOK_LOG env var).

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

LOG_FILE="${PROJECT_HOOK_LOG:-/tmp/agentic-template-hook.log}"
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] serial-worktree-clear: $*" >> "$LOG_FILE" 2>/dev/null || true
}

INPUT=""
[ ! -t 0 ] && INPUT=$(cat || true)
if [ -z "$INPUT" ]; then
  log "skipped: empty stdin"
  exit 0
fi

PARSED=$(echo "$INPUT" | "$PY" -c "
import sys, json
try:
    d = json.load(sys.stdin)
    tin = d.get('tool_input', {}) or {}
    resp = d.get('tool_response', {}) or {}
    print('\t'.join([
        'X' + d.get('session_id', ''),
        'X' + tin.get('action', ''),
        'X' + str(resp.get('exit_code', 0)),
        'X' + d.get('cwd', ''),
    ]))
except Exception:
    pass
" 2>/dev/null || echo "")

IFS=$'\t' read -r RAW_SID RAW_ACTION RAW_EC RAW_CWD <<<"$PARSED"
SESSION_ID="${RAW_SID#X}"
ACTION="${RAW_ACTION#X}"
EXIT_CODE="${RAW_EC#X}"
CWD="${RAW_CWD#X}"

if [ -z "$SESSION_ID" ]; then
  log "skipped: no session_id"
  exit 0
fi
if [ "$ACTION" != "remove" ]; then
  log "skipped: action=$ACTION session_id=$SESSION_ID"
  exit 0
fi
if [ "${EXIT_CODE:-0}" != "0" ]; then
  log "skipped: exit_code=$EXIT_CODE session_id=$SESSION_ID"
  exit 0
fi

ANCHOR=""
for candidate in "$CWD" "$PWD" "${CLAUDE_PROJECT_DIR:-}"; do
  [ -n "$candidate" ] && [ -d "$candidate" ] && ANCHOR="$candidate" && break
done
if [ -z "$ANCHOR" ]; then
  log "skipped: no usable cwd/PWD/CLAUDE_PROJECT_DIR session_id=$SESSION_ID"
  exit 0
fi

PRIMARY_TOPLEVEL=$(git -C "$ANCHOR" worktree list --porcelain 2>/dev/null \
                     | awk '/^worktree /{print $2; exit}')
if [ -z "$PRIMARY_TOPLEVEL" ]; then
  log "skipped: anchor $ANCHOR not in a git worktree session_id=$SESSION_ID"
  exit 0
fi

TARGET="$PRIMARY_TOPLEVEL/.claude/sessions/$SESSION_ID/active-work.json"
if [ -f "$TARGET" ]; then
  rm -f "$TARGET" 2>/dev/null || {
    log "skipped: rm failed $TARGET"
    exit 0
  }
  log "removed $TARGET"
else
  log "noop: no state file at $TARGET"
fi

exit 0
