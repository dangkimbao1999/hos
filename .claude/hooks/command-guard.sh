#!/usr/bin/env bash
# PreToolUse hook for Bash tool — blocks common AI-agent mistakes around git
# and enforces bun as the sole package manager/runtime for this project.

set -uo pipefail

# Resolve a usable python interpreter. On some Windows/Git Bash setups,
# `python3` on PATH is a broken Microsoft Store alias stub that exits
# non-zero instead of running Python — detect that and fall back to
# `python` (e.g. a real conda/venv install) so JSON parsing below does
# not silently no-op.
PY=python3
if ! command -v python3 >/dev/null 2>&1 || ! python3 -c "pass" >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1 && python -c "pass" >/dev/null 2>&1; then
    PY=python
  fi
fi

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | "$PY" -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('command', ''))" 2>/dev/null || printf '')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block npm/npx (project uses bun/bunx exclusively — see CLAUDE.md Tech Stack)
if echo "$COMMAND" | grep -qE '(^|[;&|]|\s)(npm|npx)(\s|$)'; then
  echo "ERROR: Use bun/bunx instead of npm/npx in this project. Replace 'npm' with 'bun' and 'npx' with 'bunx'." >&2
  exit 2
fi

# Block bare `node` invocations (use `bun` to run scripts/files instead)
if echo "$COMMAND" | grep -qE '(^|[;&|]|\s)node(\s|$)'; then
  echo "ERROR: Use 'bun' instead of 'node' to run scripts in this project." >&2
  exit 2
fi

# Block git add -A or git add . — stage specific files by name
if echo "$COMMAND" | grep -qE 'git\s+add\s+(-A|--all|\.)(\s|$)'; then
  echo "ERROR: Never use 'git add -A' or 'git add .'. Stage specific files by name: 'git add path/to/file1 path/to/file2'" >&2
  exit 2
fi

# Block --no-verify on git commands (fix hook issues instead of skipping)
if echo "$COMMAND" | grep -qE 'git\s+.*--no-verify'; then
  echo "ERROR: Never use --no-verify. If a hook fails, fix the underlying issue and retry." >&2
  exit 2
fi

# Block raw git worktree add (use EnterWorktree tool for native tracking)
if echo "$COMMAND" | grep -qE 'git\s+worktree\s+add'; then
  echo "ERROR: Use the EnterWorktree tool instead of 'git worktree add'. This enables native session tracking and cross-worktree resume." >&2
  exit 2
fi

# Block raw git worktree remove (use ExitWorktree tool)
if echo "$COMMAND" | grep -qE 'git\s+worktree\s+remove'; then
  echo "ERROR: Use the ExitWorktree tool instead of 'git worktree remove'." >&2
  exit 2
fi

exit 0
