#!/usr/bin/env bash
# serial-worktree-track.sh — fires PostToolUse on EnterWorktree.
#
# On successful EnterWorktree, writes:
#   <toplevel>/.claude/sessions/<session_id>/active-work.json
#
# Schema: { worktree_path, branch, created_at, adopted: false }
#
# Anchored on the PRIMARY worktree so track/guard/clear/adoption all
# read+write the same path even when the session's CWD drifts between
# EnterWorktree calls. No-op on failed EnterWorktree, missing session_id,
# or any internal error.
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
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] serial-worktree-track: $*" >> "$LOG_FILE" 2>/dev/null || true
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
    resp = d.get('tool_response', {}) or {}
    print('\t'.join([
        'X' + d.get('session_id', ''),
        'X' + str(resp.get('exit_code', 0)),
        'X' + resp.get('worktree_path', ''),
        'X' + resp.get('branch', ''),
        'X' + d.get('cwd', ''),
    ]))
except Exception:
    pass
" 2>/dev/null || echo "")

IFS=$'\t' read -r SESSION_ID EXIT_CODE WT_PATH BRANCH CWD <<<"$PARSED"
SESSION_ID="${SESSION_ID#X}"
EXIT_CODE="${EXIT_CODE#X}"
WT_PATH="${WT_PATH#X}"
BRANCH="${BRANCH#X}"
CWD="${CWD#X}"

if [ -z "$SESSION_ID" ]; then
  log "skipped: no session_id"
  exit 0
fi
if [ "${EXIT_CODE:-0}" != "0" ]; then
  log "skipped: exit_code=$EXIT_CODE session_id=$SESSION_ID"
  exit 0
fi
if [ -z "$WT_PATH" ]; then
  log "skipped: no worktree_path session_id=$SESSION_ID"
  exit 0
fi
if [ -z "$BRANCH" ]; then
  log "skipped: no branch session_id=$SESSION_ID"
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

TARGET_DIR="$PRIMARY_TOPLEVEL/.claude/sessions/$SESSION_ID"
TARGET="$TARGET_DIR/active-work.json"
mkdir -p "$TARGET_DIR" 2>/dev/null || exit 0

CREATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TMP="$TARGET.tmp"

WT_PATH="$WT_PATH" BRANCH="$BRANCH" CREATED_AT="$CREATED_AT" TMP="$TMP" \
"$PY" -c '
import json, os
with open(os.environ["TMP"], "w") as f:
    json.dump({
        "worktree_path": os.environ["WT_PATH"],
        "branch": os.environ["BRANCH"],
        "created_at": os.environ["CREATED_AT"],
        "adopted": False,
    }, f, separators=(",", ":"))
    f.write("\n")
' 2>/dev/null || {
  log "skipped: python3 write failed session_id=$SESSION_ID"
  exit 0
}

mv "$TMP" "$TARGET" 2>/dev/null || {
  log "skipped: mv failed session_id=$SESSION_ID"
  exit 0
}

log "wrote $TARGET branch=$BRANCH"
exit 0
