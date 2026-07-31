#!/usr/bin/env bash
# sync-main-nudge.sh — fires PreToolUse on EnterWorktree.
#
# Why: EnterWorktree's default baseRef ("fresh") already branches new
# worktrees from origin/<default-branch>, so a stale LOCAL main doesn't
# affect the new branch's content. But a stale local main still misleads
# the model during manual git investigation in the primary checkout (e.g.
# "is this branch already merged?"), which is exactly the confusion that
# prompted this hook. See .claude/rules/git-workflow.md.
#
# Behaviour:
#   - Always `git fetch origin` first (read-only, deterministic — doesn't
#     rely on the model remembering to do this).
#   - If the primary checkout is on main, its tracked working tree is
#     clean, and local main is a strict, fast-forwardable ancestor of
#     origin/main: auto fast-forward local main (safe, non-destructive,
#     no history rewrite, no data loss possible).
#   - Otherwise (dirty tree, diverged history, or checked out elsewhere):
#     soft nudge to stderr, exit 0. EnterWorktree still proceeds — its
#     branch point already comes from origin/main regardless.
#
# One outcome line per invocation appended to /tmp/agentic-template-hook.log
# (override via PROJECT_HOOK_LOG env var).

set -u

LOG_FILE="${PROJECT_HOOK_LOG:-/tmp/agentic-template-hook.log}"
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] sync-main-nudge: $*" >> "$LOG_FILE" 2>/dev/null || true
}

INPUT=""
[ ! -t 0 ] && INPUT=$(cat || true)

ANCHOR=""
CWD=""
if [ -n "$INPUT" ]; then
  PY=python3
  if ! command -v python3 >/dev/null 2>&1 || ! python3 -c "pass" >/dev/null 2>&1; then
    if command -v python >/dev/null 2>&1 && python -c "pass" >/dev/null 2>&1; then
      PY=python
    fi
  fi
  CWD=$(echo "$INPUT" | "$PY" -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('X' + d.get('cwd', ''))
except Exception:
    pass
" 2>/dev/null | sed 's/^X//' || echo "")
fi

for candidate in "$CWD" "$PWD" "${CLAUDE_PROJECT_DIR:-}"; do
  [ -n "$candidate" ] && [ -d "$candidate" ] && ANCHOR="$candidate" && break
done
if [ -z "$ANCHOR" ]; then
  log "skipped: no usable cwd/PWD/CLAUDE_PROJECT_DIR"
  exit 0
fi

PRIMARY_TOPLEVEL=$(git -C "$ANCHOR" worktree list --porcelain 2>/dev/null \
                     | awk '/^worktree /{print $2; exit}')
if [ -z "$PRIMARY_TOPLEVEL" ]; then
  log "skipped: anchor $ANCHOR not in a git worktree"
  exit 0
fi

DEFAULT_BRANCH=$(git -C "$PRIMARY_TOPLEVEL" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')
[ -z "$DEFAULT_BRANCH" ] && DEFAULT_BRANCH="main"

if ! git -C "$PRIMARY_TOPLEVEL" fetch origin "$DEFAULT_BRANCH" --quiet 2>>"$LOG_FILE"; then
  log "skipped: git fetch origin $DEFAULT_BRANCH failed (offline?)"
  exit 0
fi

LOCAL_SHA=$(git -C "$PRIMARY_TOPLEVEL" rev-parse "$DEFAULT_BRANCH" 2>/dev/null || echo "")
REMOTE_SHA=$(git -C "$PRIMARY_TOPLEVEL" rev-parse "origin/$DEFAULT_BRANCH" 2>/dev/null || echo "")

if [ -z "$LOCAL_SHA" ] || [ -z "$REMOTE_SHA" ] || [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  log "up to date: $DEFAULT_BRANCH=$LOCAL_SHA"
  exit 0
fi

CUR_BRANCH=$(git -C "$PRIMARY_TOPLEVEL" branch --show-current 2>/dev/null || echo "")
DIRTY=$(git -C "$PRIMARY_TOPLEVEL" status --porcelain --untracked-files=no 2>/dev/null)
IS_ANCESTOR=1
git -C "$PRIMARY_TOPLEVEL" merge-base --is-ancestor "$LOCAL_SHA" "$REMOTE_SHA" 2>/dev/null && IS_ANCESTOR=0

if [ "$CUR_BRANCH" = "$DEFAULT_BRANCH" ] && [ -z "$DIRTY" ] && [ "$IS_ANCESTOR" = "0" ]; then
  if git -C "$PRIMARY_TOPLEVEL" merge --ff-only "origin/$DEFAULT_BRANCH" --quiet 2>>"$LOG_FILE"; then
    log "auto-synced $DEFAULT_BRANCH: $LOCAL_SHA -> $REMOTE_SHA"
    echo "✓ Synced local '$DEFAULT_BRANCH' to origin/$DEFAULT_BRANCH ($LOCAL_SHA -> $REMOTE_SHA) before creating the worktree." >&2
    exit 0
  fi
  log "auto-sync failed: ff-only merge rejected"
fi

log "nudge: local $DEFAULT_BRANCH=$LOCAL_SHA behind origin/$DEFAULT_BRANCH=$REMOTE_SHA cur_branch=$CUR_BRANCH dirty=${DIRTY:+yes}"

cat >&2 <<EOM
⚠ Local '$DEFAULT_BRANCH' is behind origin/$DEFAULT_BRANCH in the primary checkout.

  local:  $LOCAL_SHA
  origin: $REMOTE_SHA

EnterWorktree will still branch from origin/$DEFAULT_BRANCH directly (safe),
but the primary checkout's local $DEFAULT_BRANCH is stale — investigating
"is this already merged?" or diffing against local $DEFAULT_BRANCH will give
wrong answers until you sync it:

  git -C "$PRIMARY_TOPLEVEL" checkout $DEFAULT_BRANCH
  git -C "$PRIMARY_TOPLEVEL" pull --ff-only origin $DEFAULT_BRANCH
EOM

exit 0
