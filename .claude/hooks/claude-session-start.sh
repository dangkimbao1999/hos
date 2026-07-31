#!/usr/bin/env bash
# claude-session-start.sh — fires SessionStart.
#
# Writes the current session_id to <worktree-top-level>/.claude/.current-session-id
# so that scripts invoked outside a hook can resolve the session they belong to.
#
# Anchored on `git rev-parse --show-toplevel` rather than $CLAUDE_PROJECT_DIR
# — Claude Code does not always update CLAUDE_PROJECT_DIR when a session
# navigates into a worktree.
#
# On /compact, Claude Code fires SessionStart with source="compact" and the
# SAME session_id — so the file is re-written with the unchanged value.
#
# Never writes to stdout/stderr. Never blocks session startup.

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

LOG=/tmp/agentic-template-session-start.log

log() {
  echo "[claude-session-start] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOG" 2>/dev/null || true
}

INPUT=""
if [ ! -t 0 ]; then
  INPUT=$(cat || true)
fi

SESSION_ID=""
CWD=""
if [ -n "$INPUT" ]; then
  PARSED=$(echo "$INPUT" | "$PY" -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('session_id', '') + '\t' + d.get('cwd', ''))
except Exception:
    pass
" 2>/dev/null || echo "")
  SESSION_ID=${PARSED%%$'\t'*}
  CWD=${PARSED#*$'\t'}
fi

if [ -z "$SESSION_ID" ]; then
  log "no session_id in payload — skipping"
  exit 0
fi

ANCHOR=""
for candidate in "$CWD" "$PWD" "${CLAUDE_PROJECT_DIR:-}"; do
  if [ -n "$candidate" ] && [ -d "$candidate" ]; then
    ANCHOR="$candidate"
    break
  fi
done

if [ -z "$ANCHOR" ]; then
  log "no usable cwd/PWD/CLAUDE_PROJECT_DIR — skipping"
  exit 0
fi

TOPLEVEL=$(git -C "$ANCHOR" rev-parse --show-toplevel 2>/dev/null || true)
if [ -z "$TOPLEVEL" ]; then
  log "anchor $ANCHOR is not inside a git worktree — skipping"
  exit 0
fi

TARGET="$TOPLEVEL/.claude/.current-session-id"
mkdir -p "$(dirname "$TARGET")"
printf '%s' "$SESSION_ID" > "$TARGET"
log "wrote session_id=$SESSION_ID -> $TARGET"

# ── Serial-worktree adoption ────────────────────────────────────────
# If this session starts inside a non-primary worktree on a non-main
# branch AND no .claude/sessions/<id>/active-work.json exists yet,
# write one with adopted=true. Catches the "previous session crashed,
# new session resumes inside worktree, starts new task" failure mode.

PRIMARY_TOPLEVEL=$(git -C "$TOPLEVEL" worktree list --porcelain 2>/dev/null \
                     | awk '/^worktree /{print $2; exit}')
ACTIVE_FILE="${PRIMARY_TOPLEVEL:-$TOPLEVEL}/.claude/sessions/$SESSION_ID/active-work.json"
if [ ! -f "$ACTIVE_FILE" ]; then
  if [ -n "$PRIMARY_TOPLEVEL" ] && [ "$TOPLEVEL" != "$PRIMARY_TOPLEVEL" ]; then
    BRANCH=$(git -C "$TOPLEVEL" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
    if [ -n "$BRANCH" ] && [ "$BRANCH" != "main" ] && [ "$BRANCH" != "HEAD" ]; then
      mkdir -p "$(dirname "$ACTIVE_FILE")" 2>/dev/null || true
      TMP_FILE="$ACTIVE_FILE.tmp"
      WT_PATH="$TOPLEVEL" BRANCH="$BRANCH" \
        CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)" TMP="$TMP_FILE" \
      "$PY" -c '
import json, os
with open(os.environ["TMP"], "w") as f:
    json.dump({
        "worktree_path": os.environ["WT_PATH"],
        "branch": os.environ["BRANCH"],
        "created_at": os.environ["CREATED_AT"],
        "adopted": True,
    }, f, separators=(",", ":"))
    f.write("\n")
' 2>/dev/null \
        && mv "$TMP_FILE" "$ACTIVE_FILE" 2>/dev/null \
        && log "adopted worktree $TOPLEVEL (branch=$BRANCH) for session=$SESSION_ID" \
        || rm -f "$TMP_FILE" 2>/dev/null || true
    fi
  fi
fi

exit 0
