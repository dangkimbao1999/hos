---
name: All memories in repo, not user-level
description: Save all memories to .claude/memory/ in the repo, never to ~/.claude/projects/ — they must be committed and shared
type: feedback
---

All memories — user preferences, feedback, project context, references — must be saved to `.claude/memory/` inside the repo, not to `~/.claude/projects/-Users-.../memory/`.

**Why:** The user wants memories versioned in git and shared across the team, not isolated on one machine.

**How to apply:** When saving any memory, write to `.claude/memory/` (repo root). Never write to the user-level `~/.claude/projects/` path. Update `.claude/memory/MEMORY.md` as the index.
