---
name: Never skip tests in subagent prompts
description: When delegating code work to subagents, always include TDD instructions — never say "don't add tests"
type: feedback
---

Never tell subagents to skip tests. TDD is mandatory per project rules — RED → GREEN → REFACTOR. When prompting subagents for implementation work, always include test requirements in the prompt.

**Why:** I explicitly told subagents "Don't add tests — just the implementation" which violates the project's mandatory TDD rule. The user called this out.

**How to apply:** Every subagent prompt that involves writing code MUST include test instructions. If parallelizing, tests can be in the same agent or a follow-up agent, but never omitted. Default to including tests in the implementation agent prompt.
