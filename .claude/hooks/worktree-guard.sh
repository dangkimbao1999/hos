#!/usr/bin/env bash
# UserPromptSubmit hook — worktree directory guard.
#
# Warns if the current directory no longer exists (worktree was removed
# between prompts, e.g. by an external `rm` or a teammate).

PRIMARY=$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //')
[ -z "$PRIMARY" ] && exit 0

CURRENT=$(pwd 2>/dev/null)

if [ ! -d "$CURRENT" ] 2>/dev/null; then
  cat <<EOM
{"systemMessage": "CRITICAL: Your current directory no longer exists (worktree was removed). Use EnterWorktree to create a new worktree."}
EOM
fi

exit 0
