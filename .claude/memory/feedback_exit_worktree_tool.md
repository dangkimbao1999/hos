---
name: Worktree teardown — use ExitWorktree tool, not the bash script
description: When ending a session in a worktree (especially after force-merging a PR), tear it down via the ExitWorktree tool — not `bash scripts/remove-worktree.sh` and not raw `git worktree remove`.
type: feedback
---

After `gh pr merge` succeeds, tear down the session's worktree with the
**`ExitWorktree` tool**, not `bash scripts/remove-worktree.sh` and not
raw `git worktree remove` / `git branch -d`.

```
ExitWorktree(action: "remove", discard_changes: true)
```

`discard_changes: true` is required at this stage because the squash-merge
commit on `main` has a different sha than the worktree branch's HEAD —
without the flag, `ExitWorktree` will refuse on "unmerged commits" even
though the PR is fully merged remotely.

**Why:** The session's worktree is owned by the `EnterWorktree` /
`ExitWorktree` pair. Only the tool tears down the worktree directory,
deletes the branch, restores the session's working directory, clears
CWD-dependent caches (system prompt sections, memory, plans dir), and
kills any attached tmux session in one step. The bash script does the
filesystem teardown but leaves the session state stale.

**How to apply:**
- Default in the `force-merge-pr` skill's post-merge cleanup step.
- Default whenever the user says "exit worktree", "remove this worktree",
  or "we're done here" inside an `EnterWorktree`-created worktree.
- Fall back to `bash scripts/remove-worktree.sh
  .claude/worktrees/<name>` ONLY when `ExitWorktree` reports "no worktree
  session is active" — that means `EnterWorktree` was never called and
  the tool is a deliberate no-op (e.g. someone created the worktree
  manually before Claude joined the session).

The `force-merge-pr` skill (`.claude/skills/force-merge-pr/SKILL.md`)
was updated on 2026-04-22 to reflect this — Step 4 now says
`ExitWorktree(...)` first and demotes the bash script to an escape
hatch. Hard-ban added in the skill's safety-rules block.
