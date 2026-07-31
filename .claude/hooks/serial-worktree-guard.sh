#!/usr/bin/env bash
# serial-worktree-guard.sh — fires PreToolUse on EnterWorktree.
#
# If the session already has active-work.json describing a still-on-disk
# worktree with a still-existing branch, emit a soft nudge to stderr.
# The tool call is allowed (exit 0); the nudge prompts the agent to ask
# the human whether to continue in the current worktree or finish it first.
#
# Self-heals: if the recorded worktree is gone OR the branch is gone,
# the state file is deleted and the guard stays silent.
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
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] serial-worktree-guard: $*" >> "$LOG_FILE" 2>/dev/null || true
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
    print('X' + d.get('session_id', '') + '\t' + 'X' + d.get('cwd', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

IFS=$'\t' read -r RAW_SID RAW_CWD <<<"$PARSED"
SESSION_ID="${RAW_SID#X}"
CWD="${RAW_CWD#X}"

if [ -z "$SESSION_ID" ]; then
  log "skipped: no session_id"
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

ACTIVE_FILE="$PRIMARY_TOPLEVEL/.claude/sessions/$SESSION_ID/active-work.json"
if [ ! -f "$ACTIVE_FILE" ]; then
  log "skipped: no active-work.json session_id=$SESSION_ID"
  exit 0
fi

INNER=$(cat "$ACTIVE_FILE" 2>/dev/null | "$PY" -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('X' + d.get('worktree_path', '') + '\t' + 'X' + d.get('branch', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

IFS=$'\t' read -r RAW_WT RAW_BRANCH <<<"$INNER"
WT_PATH="${RAW_WT#X}"
BRANCH="${RAW_BRANCH#X}"

if [ -z "$WT_PATH" ] || [ ! -d "$WT_PATH" ]; then
  log "self-heal: worktree gone session_id=$SESSION_ID wt=$WT_PATH"
  rm -f "$ACTIVE_FILE" 2>/dev/null || true
  exit 0
fi
if [ -z "$BRANCH" ] || ! git -C "$PRIMARY_TOPLEVEL" show-ref --verify --quiet "refs/heads/$BRANCH" 2>/dev/null; then
  log "self-heal: branch gone session_id=$SESSION_ID branch=$BRANCH"
  rm -f "$ACTIVE_FILE" 2>/dev/null || true
  exit 0
fi

PR_NUMBER=""
PR_LINE=""
PR_JSON=$(gh pr list --head "$BRANCH" --state open --json number,url --limit 1 2>/dev/null || echo "")
if [ -n "$PR_JSON" ]; then
  PR_NUMBER=$(echo "$PR_JSON" | "$PY" -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['number'] if d else '')
except Exception:
    pass
" 2>/dev/null || echo "")
  [ -n "$PR_NUMBER" ] && PR_LINE="  PR     : #${PR_NUMBER} (open)"
fi

log "nudge: session_id=$SESSION_ID wt=$WT_PATH branch=$BRANCH pr=${PR_NUMBER:-none}"

cat >&2 <<EOM
⚠ Serial worktree policy

This session already has an active worktree:
  path   : $WT_PATH
  branch : $BRANCH
${PR_LINE:+$PR_LINE
}
You're about to create a SECOND worktree. Per project policy:
  ONE Claude Code session → ONE worktree → ONE PR at a time.

EnterWorktree will still run, but before you proceed, ASK THE HUMAN
which of these they want:

  A) Continue task B in the CURRENT worktree ($BRANCH). Skip the
     new EnterWorktree call entirely.

  B) Finish current work first: commit + push + merge the PR,
     then ExitWorktree(action: "remove"). THEN create the new
     worktree for task B.

Do not silently proceed with parallel worktrees.
EOM

exit 0
