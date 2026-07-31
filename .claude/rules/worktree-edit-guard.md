# Worktree Edit Guard

The `worktree-edit-guard.sh` PreToolUse hook runs before every Edit, Write,
MultiEdit, and NotebookEdit call. It enforces two invariants independently;
violating either blocks the tool call with `exit 2`.

## Invariant 1 — no cross-worktree edits (same repo)

`Edit`/`Write` take **absolute paths**, but the shell `cwd` (`EnterWorktree`
controls that) and the path-resolver are independent. A stale absolute path
from an earlier turn can silently write to the **wrong** checkout — usually
the primary on `main`.

The hook resolves the file's git toplevel and the session's active worktree
(`$CLAUDE_PROJECT_DIR`, falling back to `$PWD`'s toplevel). It blocks
**only when both resolve into the same repo** — i.e. their
`git rev-parse --git-common-dir` values match. Cross-*repo* edits (e.g.
editing your personal `~/.claude/` config repo from inside this project's
worktree) are legitimate and pass through untouched.

## Invariant 2 — no edits on primary main

When the active worktree IS the primary checkout AND `HEAD == main`, the
hook blocks edits **outside `.claude/*`**. Create a worktree first via
`EnterWorktree(name: "feat-...")`. Edits inside `.claude/` (settings, hooks,
rules, skills, memory) are allowed on main because that's how project
config gets maintained.

**Known gap**: invariant 2 does not check the *target* file's own git root
— it blocks based only on the *active session's* root+branch. So if you're
in a primary-main session of THIS repo and want to write a file in a
completely unrelated repo/directory, the hook still blocks it. Workaround:
use Bash (`cat > file <<EOF`) instead of Edit/Write for that one-off, or
open a worktree.

## Recovery when blocked

- **Cross-worktree block** → rewrite `file_path` so it starts with the
  printed ACTIVE_ROOT, or switch sessions via `ExitWorktree` then
  `EnterWorktree(path: "...")`.
- **Primary-on-main block** → call `EnterWorktree(name: "feat-...")`, then
  retry the edit from inside the worktree.

Never disable the guard by editing `.claude/settings.json` or renaming the
hook to work around an alarm — that's exactly the silent-smuggle failure
mode this hook exists to catch.

## Load this rule when

- About to call Edit, Write, MultiEdit, or NotebookEdit and the tool returns
  a `BLOCKED:` message containing "cross-worktree" or "primary worktree".
- Modifying `.claude/hooks/worktree-edit-guard.sh`.

## Skip when

- Read-only operations (Read, Grep, Glob, Bash without write side-effects).
