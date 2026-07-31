#!/usr/bin/env bash
# worktree-edit-guard.sh — PreToolUse hook on Edit / Write / MultiEdit / NotebookEdit.
#
# Two independent invariants enforced; failing either blocks the tool call.
#
#  1. Cross-root smuggle (the silent bug):
#     Edit/Write take absolute paths, so a path left over from an earlier
#     turn can silently write to a different checkout than the one the
#     session is "in". When file_path's git toplevel differs from the
#     session's active worktree, block — the model must rewrite the path.
#
#  2. Primary-on-main edit:
#     When the active worktree IS the primary checkout AND HEAD == main,
#     block edits outside .claude/* so the model creates a worktree first.
#
# Exit codes: 0 = allow, 2 = hard block.
# Fails open on internal error (better to allow than wedge editing for
# harness setups we don't anticipate).
#
# NOTE (generic template): check 2 blocks ANY edit while the active session
# is primary+main, even to files outside this repo entirely — it does not
# compare file_path's own git root before applying that rule. If you hit
# this while editing an unrelated project from a primary-main session, use
# Bash (heredoc/cat) to write the file instead, or create a worktree first.
#
# FIXED (2026-07-26): the .claude/* exemption in check 2 used a forward-slash
# case pattern only, so it silently never matched on Windows — Claude Code
# delivers file_path there with backslashes (e.g. C:\Users\...\.claude\...),
# meaning every .claude/ edit was wrongly blocked from primary main on
# Windows. Fixed by normalizing FILE_PATH to forward slashes right after
# extraction, below — a safe no-op on macOS/Linux, where paths never contain
# backslashes to begin with, so the same normalized value is used
# consistently on all three platforms for every check in this script.

set -uo pipefail

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | grep -o '"file_path":"[^"]*"' | head -1 | cut -d'"' -f4)

[ -z "$FILE_PATH" ] && exit 0

# Normalize path separators (Windows delivers backslashes; case-pattern
# globs and the dirname/git calls below expect forward slashes). No-op on
# macOS/Linux.
FILE_PATH="${FILE_PATH//\\//}"

ACTIVE_ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$ACTIVE_ROOT" ]; then
  ACTIVE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
fi

if [ -n "$ACTIVE_ROOT" ] && [ -d "$ACTIVE_ROOT" ]; then
  ACTIVE_ROOT=$(git -C "$ACTIVE_ROOT" rev-parse --show-toplevel 2>/dev/null || echo "$ACTIVE_ROOT")
fi

PWD_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -n "$PWD_ROOT" ] && [ -n "$ACTIVE_ROOT" ] && [ "$PWD_ROOT" != "$ACTIVE_ROOT" ]; then
  ACTIVE_COMMON=$(git -C "$ACTIVE_ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || echo "")
  PWD_COMMON=$(git -C "$PWD_ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || echo "")
  if [ -n "$ACTIVE_COMMON" ] && [ "$ACTIVE_COMMON" = "$PWD_COMMON" ]; then
    ACTIVE_ROOT="$PWD_ROOT"
  fi
fi

FILE_DIR=$(dirname "$FILE_PATH")
while [ ! -d "$FILE_DIR" ] && [ "$FILE_DIR" != "/" ] && [ "$FILE_DIR" != "." ]; do
  FILE_DIR=$(dirname "$FILE_DIR")
done
FILE_ROOT=$(git -C "$FILE_DIR" rev-parse --show-toplevel 2>/dev/null || echo "")

# ── Check 1: cross-worktree smuggle (same repo, wrong worktree) ─────────
if [ -n "$ACTIVE_ROOT" ] && [ -n "$FILE_ROOT" ] && [ "$ACTIVE_ROOT" != "$FILE_ROOT" ]; then
  ACTIVE_COMMON=$(git -C "$ACTIVE_ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || echo "")
  FILE_COMMON=$(git -C "$FILE_ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || echo "")
  if [ -n "$ACTIVE_COMMON" ] && [ "$ACTIVE_COMMON" = "$FILE_COMMON" ]; then
    cat >&2 <<EOM
BLOCKED: cross-worktree edit refused.

  file_path resolves to git toplevel : $FILE_ROOT
  active session worktree            : $ACTIVE_ROOT
  shared git common dir              : $ACTIVE_COMMON

Rewrite file_path so it starts with:

  $ACTIVE_ROOT/

If you genuinely need to edit the other worktree, switch sessions there via
ExitWorktree + EnterWorktree(path: "..."). Do NOT bypass this guard by editing
.claude/settings.json or renaming this hook.
EOM
    exit 2
  fi
fi

# ── Check 2: primary-on-main edit ───────────────────────────────────────
if [ -n "$ACTIVE_ROOT" ]; then
  PRIMARY=$(git -C "$ACTIVE_ROOT" worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //')
  if [ -n "$PRIMARY" ] && [ "$ACTIVE_ROOT" = "$PRIMARY" ]; then
    BRANCH=$(git -C "$ACTIVE_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    if [ "$BRANCH" = "main" ]; then
      case "$FILE_PATH" in
        .claude/*|*/.claude/*) exit 0 ;;
      esac
      cat >&2 <<'EOM'
BLOCKED: You are in the primary worktree on main. Create a worktree before editing code.

Use the EnterWorktree tool (e.g., EnterWorktree(name: "feat-my-feature")).
The branch is auto-renamed to feat/my-feature by the PostToolUse hook.
EOM
      exit 2
    fi
  fi
fi

exit 0