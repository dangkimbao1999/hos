#!/usr/bin/env bash
# stop-dev-services.sh — SessionEnd hook stub.
#
# CUSTOMIZE: once your project has a local dev-server convention (e.g. a
# `scripts/dev.sh start` that writes PIDs to a known directory), fill this
# in to stop only THIS session/worktree's services — never the primary
# worktree's. SAFETY RULE: if you can't determine ownership, do NOTHING;
# leaving servers running is always safer than killing the wrong ones.
#
# Minimal example convention (uncomment + adapt):
#
# WORKTREE=$(pwd 2>/dev/null)
# PRIMARY=$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //')
# [ -z "$PRIMARY" ] && exit 0
# [ "$WORKTREE" = "$PRIMARY" ] && exit 0   # never touch primary's services
# [ -f "$WORKTREE/.dev-pids" ] || exit 0
# while IFS= read -r pid; do
#   kill "$pid" 2>/dev/null || true
# done < "$WORKTREE/.dev-pids"
# rm -f "$WORKTREE/.dev-pids"

exit 0
