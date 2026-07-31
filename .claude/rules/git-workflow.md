# Git Workflow

Key reminders:
- Always sync `main` before branching — `git fetch origin && git checkout main && git pull --ff-only origin main` in the primary checkout, before the first `EnterWorktree` of a session. Backed by the `sync-main-nudge.sh` hook (see below) so this doesn't rely on remembering to do it manually.
- Feature branches: `feat/`, `fix/`, `chore/` — never commit to main directly
- Always work in a worktree — never in the primary checkout (main)
- Stage specific files only (never `git add -A` or `git add .`)
- Typecheck before every commit
- Create a PR after completing tasks
- **PRs MUST be opened as draft** (`gh pr create --draft …`). Promote with
  `gh pr ready <pr>` only after consent (AskUserQuestion answer, OR an
  explicit "ship it" / "merge this PR" instruction from the human in the
  same turn). Even when every tracked task looks done, the human may want
  more in this PR before review starts.

## Draft-by-default PR rule

`gh pr create` without `--draft` is blocked by the `pr-draft-default.sh`
PreToolUse hook. This prevents accidental merges of unfinished work — a
non-draft PR signals "ready for review", and reviewers may merge it.

**Promotion checklist — only consider marking ready when ALL are true:**
1. All coding tasks complete.
2. Typecheck + relevant tests pass locally.
3. All requested review changes have been addressed (or explicitly deferred).
4. PR description accurately reflects what's in the diff.

**Then** — set `PROJECT_PR_READY_CONFIRMED=1` on the `gh pr ready` call. The
env-var prefix is the record of consent, earned via:

- **Path A (Claude proposes promotion)**: call `AskUserQuestion` first — the
  human may want to keep the PR in draft and add more work. Only after the
  human picks "mark ready" does Claude set the env var and run `gh pr ready`.
- **Path B (human instructed promotion)**: when the human explicitly said
  "ship it", "merge this PR", "mark PR ready", the instruction itself IS the
  consent — proceed straight to `PROJECT_PR_READY_CONFIRMED=1 gh pr ready …`.

`gh pr ready --undo` (ready → draft) is always allowed without confirmation
— that's the safe direction.

**Skipping draft entirely** (`PROJECT_PR_NON_DRAFT=1 gh pr create …`): same
Path B logic — only when the human has explicitly instructed a ship-now flow.

## Sync-main enforcement (`sync-main-nudge.sh`)

Fires PreToolUse on `EnterWorktree`, before `serial-worktree-guard.sh`.
`EnterWorktree`'s default `baseRef` ("fresh") already branches new
worktrees from `origin/<default-branch>`, so a stale *local* main never
leaks into a new branch's content — this hook exists for the primary
checkout itself, whose stale local main misleads manual git investigation
(e.g. "is this branch already merged?").

- Always runs `git fetch origin <default-branch>` first — deterministic,
  doesn't depend on the model remembering.
- If the primary checkout is on the default branch, its tracked working
  tree is clean, and local main fast-forwards cleanly to `origin/main`: auto
  fast-forwards it (safe, non-destructive, no history rewrite).
- Otherwise (dirty tree, diverged history, checked out elsewhere): prints a
  stderr nudge with the exact commands to sync manually. Never blocks
  `EnterWorktree` — the new worktree's branch point is unaffected either way.
- Fails open: offline / fetch failure / not a git worktree → stays silent.

## Serial Worktree / PR Policy (enforced by hooks)

A single Claude Code session should hold AT MOST one worktree AND one open
PR at a time. Running multiple worktrees/PRs in parallel from one session is
how stale worktree piles accumulate.

Four hooks enforce this as a **soft nudge** (not a hard block):

- **`serial-worktree-track.sh`** (PostToolUse on `EnterWorktree`): on
  success, writes `<primary-worktree>/.claude/sessions/<session-id>/active-work.json`
  with `{ worktree_path, branch, created_at, adopted: false }`.
- **`serial-worktree-clear.sh`** (PostToolUse on `ExitWorktree`): on
  `action="remove"` + `exit_code=0`, deletes the state file.
- **`serial-worktree-guard.sh`** (PreToolUse on `EnterWorktree`): if the
  session already has a valid active worktree, prints a stderr nudge before
  the second `EnterWorktree` runs. Self-heals stale state (deletes the file,
  stays silent) when the worktree directory or branch was removed manually.
- **`serial-pr-guard.sh`** (PreToolUse on `Bash(gh pr create*)`): if the
  session's active branch already has an OPEN PR, prints a stderr nudge
  before the second `gh pr create` runs.

When a nudge fires, ask the human between two paths:
- **A) Continue in current worktree/PR** — bundle the new task in.
- **B) Finish current PR first** — commit, push, merge, `ExitWorktree`, THEN
  create the new worktree/PR.

The hooks **fail open**: missing `gh`, missing python3, expired credentials,
manually-deleted worktrees, malformed state files — none of these block the
call. They just stay silent.

## Worktree Creation

Use `EnterWorktree` tool (or `claude --worktree` flag) to create worktrees.
Never use `git worktree add` directly. Worktree name uses `-` where branch
uses `/`:
- `EnterWorktree(name: "feat-my-feature")` → branch auto-renamed to
  `feat/my-feature`
- `EnterWorktree(name: "fix-scroll-bug")` → branch auto-renamed to
  `fix/scroll-bug`

The `worktree-post-enter.sh` hook auto-renames the branch.

## Post-merge cleanup

After a PR merges, tear down the worktree with `ExitWorktree(action:
"remove", discard_changes: true)` immediately — don't defer it. Principle:
**ONE PR ↔ ONE worktree ↔ ONE branch.** If you want to do more work after
merge, create a NEW worktree on a NEW branch for the NEXT PR.

`post-merge-mark-exit.sh` + `permission-allow-exit-after-merge.sh` work
together so the `ExitWorktree` permission prompt auto-approves for 10
minutes after a successful `gh pr merge` — you already authorized the
teardown by running the merge.

Load the `git-workflow` skill when:
- About to run `git commit`, `git push`, `git rebase`, or `gh pr create`
- Creating worktrees or switching branches
- Resolving merge/rebase conflicts
- Preparing to finish a task and push work

Skip the `git-workflow` skill when:
- Only reading git history (`git log`, `git diff`, `git status`)
- The task involves no git operations
