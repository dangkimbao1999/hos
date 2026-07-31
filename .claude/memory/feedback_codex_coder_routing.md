# Codex-coder routing belongs to the main agent

When deciding whether to launch `@codex-coder`, the main agent should keep the
token-efficiency boundary in mind:

- If the user already provided the complete file body and the task is merely to
  write that body verbatim, do not route through `codex-coder`; use the main
  agent's normal file-edit path instead.
- If the user provided requirements, a partial snippet, or references to files
  that Codex can read itself, routing to `codex-coder` is appropriate when the
  engineer explicitly asked for Codex.

This is a **main-agent routing decision only**. Once `codex-coder` is launched,
the router must never create, edit, read, inspect, or verify files itself. The
router's job is only setup, wrapper dispatch, status relay, and final relay.
