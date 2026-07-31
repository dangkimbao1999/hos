#!/usr/bin/env bash
# PostToolUse hook for EnterWorktree — auto-rename branch to convention.
#
# EnterWorktree creates branches as "worktree-<name>" (e.g., worktree-feat-x).
# This hook renames them to "<type>/<name>" (e.g., feat/x).
#
# Known prefixes: feat, fix, chore, refactor, docs, test, ci

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -z "$BRANCH" ] && exit 0

case "$BRANCH" in
  worktree-*) ;;
  *) exit 0 ;;
esac

NAME="${BRANCH#worktree-}"

NEW_BRANCH=""
for prefix in feat fix chore refactor docs test ci; do
  case "$NAME" in
    ${prefix}-*)
      NEW_BRANCH="${prefix}/${NAME#${prefix}-}"
      break
      ;;
  esac
done

if [ -z "$NEW_BRANCH" ]; then
  exit 0
fi

git branch -m "$NEW_BRANCH" 2>/dev/null || exit 0

cat <<EOM
{"systemMessage": "Worktree ready. Branch: ${NEW_BRANCH} | Worktree: ${NAME} | Path: $(pwd)"}
EOM

exit 0
