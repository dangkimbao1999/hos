# Skill Discovery — Check This Repo's Own Skills First

The skills list injected into the system prompt at session start only
reflects **global/plugin** skills. It does NOT include this repo's own
`.claude/skills/` — those are only discoverable by actually looking in the
folder. Don't assume the injected list is complete.

**Before starting any non-trivial task** — especially generating a document
or deliverable, or following a procedure that plausibly already has a
convention — run a quick check for a project-specific skill first:

```
Glob(".claude/skills/**", path: "<repo root>")
```

If a matching `SKILL.md` exists, read and follow it instead of drafting
from general knowledge. A project-specific skill (e.g. `brd-generation`
with SBSI's actual BRD template) always takes precedence over a generic
global skill (e.g. the generic `docx` skill) or your own default structure
for that document type.

## Team-shared skills vs. personal setup

The team uses the Claude Code desktop app against this repo as their
shared baseline: `.claude/skills/` and `.claude/rules/` here are the
conventions the **whole team** has agreed on and version-controls
together (e.g. `brd-generation`, `git-workflow`, `brainstorming`).
Individual teammates may also install their own personal skills/plugins
globally (via `/plugin install` or similar) — that's expected and normal,
but a personal skill is NOT guaranteed to exist for every teammate, and
its content isn't reviewed as part of this repo.

When a personally-installed skill/plugin overlaps with one already defined
in this repo's `.claude/skills/` (e.g. a teammate's own
`superpowers:brainstorming` plugin alongside this repo's own
`brainstorming` skill), **prefer this repo's own `.claude/skills/`
version** for work that affects the shared repo or is done on behalf of
the team — it's the version everyone can see, review, and update
together in one place. Personal skills remain useful for a teammate's own
workflow elsewhere, but shouldn't silently substitute for the team
standard here.

## Load this rule when

- Starting a task that could plausibly have a project-specific skill:
  document/deliverable generation, a named artifact type (BRD, SRS, design
  doc), or a repeated internal workflow.
- About to invoke a global skill (docx, pptx, xlsx, pdf) for a deliverable
  — check for a more specific local one first.
- A personal plugin/global skill appears to overlap with one already
  defined in this repo's `.claude/skills/`.

## Skip when

- Purely conversational tasks with no deliverable.
- You've already confirmed this session that no relevant local skill
  exists for this task type.
