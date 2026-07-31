#!/usr/bin/env bash
# serial-pr-guard.sh — fires PreToolUse on Bash, conditional
# `Bash(gh pr create*)`. If the session's active branch already has
# an OPEN PR on GitHub, emit a soft nudge to stderr and exit 0. The
# `gh pr create` call still runs.
#
# Fail-open on gh errors: if `gh pr list` returns empty or errors,
# the hook stays silent.
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
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] serial-pr-guard: $*" >> "$LOG_FILE" 2>/dev/null || true
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
    cmd = d.get('tool_input', {}).get('command', '')
    print('X' + d.get('session_id', '') + '\t' + 'X' + cmd + '\t' + 'X' + d.get('cwd', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

IFS=$'\t' read -r RAW_SID RAW_CMD RAW_CWD <<<"$PARSED"
SESSION_ID="${RAW_SID#X}"
COMMAND="${RAW_CMD#X}"
CWD="${RAW_CWD#X}"

if [ -z "$SESSION_ID" ]; then
  log "skipped: no session_id"
  exit 0
fi

if ! echo "$COMMAND" | grep -qE 'gh[[:space:]]+pr[[:space:]]+create'; then
  log "skipped: not gh pr create"
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
    print('X' + d.get('branch', ''))
except Exception:
    pass
" 2>/dev/null || echo "")
RAW_BRANCH="$INNER"
BRANCH="${RAW_BRANCH#X}"

if [ -z "$BRANCH" ]; then
  log "skipped: empty branch in state session_id=$SESSION_ID"
  exit 0
fi

PR_JSON=$(gh pr list --head "$BRANCH" --state open --json number,url --limit 1 2>/dev/null || echo "")
if [ -z "$PR_JSON" ]; then
  log "skipped: gh empty/failed branch=$BRANCH"
  exit 0
fi

PR_INFO=$(echo "$PR_JSON" | "$PY" -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d:
        print('X' + str(d[0]['number']) + '\t' + 'X' + d[0].get('url', ''))
except Exception:
    pass
" 2>/dev/null || echo "")

if [ -z "$PR_INFO" ]; then
  log "skipped: no open PR for branch=$BRANCH"
  exit 0
fi

IFS=$'\t' read -r RAW_PR_NUM RAW_PR_URL <<<"$PR_INFO"
PR_NUMBER="${RAW_PR_NUM#X}"
PR_URL="${RAW_PR_URL#X}"

log "nudge: session_id=$SESSION_ID branch=$BRANCH pr=#$PR_NUMBER"

cat >&2 <<EOM
⚠ Serial PR policy

This session already has an open PR:
  #${PR_NUMBER}  ${BRANCH}  ${PR_URL}

You're about to open a SECOND PR. Per project policy:
  ONE Claude Code session → ONE PR at a time.

\`gh pr create\` will still run, but before you proceed, ASK THE HUMAN:

  A) Push the new commits to the EXISTING branch (${BRANCH}) and
     update PR #${PR_NUMBER} with \`gh pr edit --body\` instead. No new PR.

  B) Wait until PR #${PR_NUMBER} is merged + the worktree is torn down,
     then create the new worktree + branch + PR for the new work.
EOM

exit 0
