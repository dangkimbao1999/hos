#!/usr/bin/env bash
# post-merge-mark-exit.sh — fires PostToolUse on Bash.
#
# When `gh pr merge` succeeds, drop a per-worktree timestamp marker so
# the next ExitWorktree(action="remove") call can be auto-approved by
# permission-allow-exit-after-merge.sh. The user already authorised the
# teardown by running the merge — they shouldn't have to click "approve"
# on the worktree clean-up that's the immediate next step.
#
# No-op on non-`gh pr merge` commands or failed merges.
#
# Marker path overridable via PROJECT_MERGE_MARKER_FILE (used by tests).
# Defaults to /tmp/agentic-template-pending-exit-merge-<hash>, where <hash>
# is sha1(CLAUDE_PROJECT_DIR) truncated to 16 chars, scoping one marker per
# worktree so parallel sessions can't auto-approve each other.

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

COMMAND=$(echo "$INPUT" | "$PY" -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

if ! echo "$COMMAND" | grep -qE 'gh[[:space:]]+pr[[:space:]]+merge'; then
  exit 0
fi

EXIT_CODE=$(echo "$INPUT" | "$PY" -c "
import sys, json
d = json.load(sys.stdin)
out = d.get('tool_output', {})
if isinstance(out, dict):
    print(out.get('exit_code', out.get('returncode', 0)))
else:
    print(0)
" 2>/dev/null || echo "0")

if [ "$EXIT_CODE" != "0" ]; then
  exit 0
fi

MARKER="${PROJECT_MERGE_MARKER_FILE:-}"
if [ -z "$MARKER" ]; then
  HASH=$(printf '%s' "${CLAUDE_PROJECT_DIR:-$PWD}" | shasum 2>/dev/null | awk '{print $1}' | cut -c1-16)
  MARKER="/tmp/agentic-template-pending-exit-merge-${HASH:-default}"
fi

date +%s > "$MARKER" 2>/dev/null || true

cat <<'EOM'
✅ PR merged. Mandatory post-merge sequence:

STEP 1 (immediate, do NOT ask permission): Call ExitWorktree(action: "remove", discard_changes: true).
   The PermissionRequest hook auto-approves it because the merge marker is valid for 10 min.
   The PostToolUse hook then removes the worktree dir AND fast-forwards primary main from origin.

⚠ Principle: ONE PR ↔ ONE worktree ↔ ONE branch. The worktree's job ends the
moment its PR merges. If you want to do more work, create a NEW worktree on a
NEW branch for the NEXT PR — never reuse a post-merge worktree.
EOM

exit 0
