# Claude Code Conventions

When persisting project knowledge, choose the right format:
- **Rule** (`.claude/rules/`) — short always-loaded reminder, ~15-25 lines,
  with load conditions ("Load this rule when" / "Skip when")
- **Skill** (`.claude/skills/<name>/SKILL.md`) — detailed content, loaded on
  demand via the Skill tool
- **Hook** (`.claude/hooks/`) — deterministic shell enforcement, registered
  in `.claude/settings.json`
- **Sub-agent** (`.claude/agents/<name>.md`) — a dispatchable specialist with
  its own scope/tool access, for work worth delegating out of the main
  context
- **Memory** (`.claude/memory/`) — durable facts about the project, feedback,
  and decisions that should survive across sessions (see the Memory section
  below)

## Decision guide

- Would every session benefit from knowing this in ~20 lines? → **rule**
- Is this a multi-step procedure only needed for specific tasks? → **skill**
- Can this be enforced deterministically by a script (block/allow/nudge)? →
  **hook**
- Is this a bounded unit of work worth running with its own context and
  reporting back a digest? → **sub-agent**
- Is this a fact/preference/decision that should persist across sessions
  without being loaded every time? → **memory**

## Rule file shape

```markdown
# <Title>

<15-25 lines of the actual reminder — what to do, briefly why>

## Load this rule when

- <specific trigger 1>
- <specific trigger 2>

## Skip when

- <specific exclusion 1>
```

## Skill file shape (`.claude/skills/<name>/SKILL.md`)

Skills carry the detailed step-by-step procedure that a rule only
summarizes. Reference the skill by name from the corresponding rule's "Load
when" section.

## Load this rule when

- User asks to "remember", "note down", or "document" a convention or rule
- User asks to create a new rule, skill, hook, or sub-agent
- Deciding where new project knowledge should live
- Reviewing or updating existing rules/skills for correctness

## Skip when

- Simply following an existing rule or skill (not creating or modifying one)
- The task has nothing to do with project knowledge management
