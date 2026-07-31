#!/usr/bin/env bash
# post-exit-pull-main.sh — fires PostToolUse on ExitWorktree.
#
# After ExitWorktree restores the session to the primary checkout, fast-
# forward primary main from origin so the next worktree branched off main
# starts on a current tree.
#
# Hard guarantees:
#   - ff-only merge (--ff-only) — never rewrites local history, never
#     creates merge commits, fails loudly on divergence.
#   - Skips when primary is on a feature branch.
#   - Skips when primary's working tree is dirty.
#   - Exit 0 on any failure path — PostToolUse hooks must never block.

set -u

cat >/dev/null 2>&1 || true

PRIMARY=$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //')
[ -z "$PRIMARY" ] && exit 0
[ -d "$PRIMARY" ] || exit 0

cd "$PRIMARY" 2>/dev/null || exit 0

BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
[ "$BRANCH" = "main" ] || exit 0

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "ℹ️  primary main has uncommitted changes — skipping auto-pull"
  exit 0
fi

if ! git fetch origin main --quiet 2>/dev/null; then
  exit 0
fi

if git merge-base --is-ancestor origin/main HEAD 2>/dev/null; then
  exit 0
fi

BEFORE=$(git rev-parse HEAD 2>/dev/null)

if git merge --ff-only origin/main --quiet 2>/dev/null; then
  AFTER=$(git rev-parse HEAD 2>/dev/null)
  AHEAD=$(git rev-list --count "$BEFORE..$AFTER" 2>/dev/null || echo "?")
  echo "✅ primary main fast-forwarded ($AHEAD new commits from origin)"
else
  echo "⚠️  primary main has diverged from origin — cannot fast-forward; pull manually with rebase"
fi

exit 0
