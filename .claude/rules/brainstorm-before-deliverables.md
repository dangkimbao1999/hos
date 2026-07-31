# Brainstorm Before Any Deliverable

Before producing ANY deliverable in this repo — a document (BRD, etc.), a
demo app (`demos/`), or a design/mockup — invoke the `brainstorming` skill
to clarify what the output specifically should be, unless the user has
already fully defined it in their prompt. Don't skip straight to drafting
just because the request "sounds clear enough" — that's the exact
anti-pattern the skill itself warns against.

## What counts as "already defined"

Skip re-clarifying only when the prompt itself already pins down the
concrete output — format, scope, and template/target all answered. E.g.
"generate a BRD for the watchlist feature using the standard template,
covering scope X/Y/Z" already answers what/format/scope. A vague ask like
"write me a BRD" or "mock up a new screen" still needs the brainstorming
dialogue first — one question at a time, per the skill.

## Terminal step depends on the deliverable type

The vendored `brainstorming` skill (`.claude/skills/brainstorming/SKILL.md`)
says its only valid next step is invoking `writing-plans` — that's correct
for code/demo work, but this repo produces more than code. Route the
terminal step by deliverable type instead:

- **Document** -> `brd-generation` skill (SBSI's own BRD template)
- **Design/mockup** -> `design-request-intake` skill, then Figma/Stitch
  generation (`.claude/rules/figma-design.md`, `.claude/rules/stitch-design.md`)
- **Demo app / code** (`demos/`) -> `writing-plans` as the skill already
  specifies, then normal TDD/git-workflow

## Load this rule when

- Starting any task that will end in a document, demo app, or
  design/mockup deliverable, and the user hasn't already spelled out the
  concrete output in their prompt.

## Skip when

- The user's prompt already fully specifies the output (format, scope,
  template/target) — no need to re-ask.
- Purely conversational/informational tasks with no deliverable.
- Continuing a task whose design was already brainstormed and approved
  earlier this session.
