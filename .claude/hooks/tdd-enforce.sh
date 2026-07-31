#!/usr/bin/env bash
# PreToolUse hook — blocks git commit when staged source files lack test files.
# Enforces the red/green TDD requirement: no source without a test.
#
# CUSTOMIZE FOR YOUR STACK: this example checks .ts/.tsx files with a sibling
# `.test.ts` / `__tests__/*.test.ts` convention. If your project uses Python,
# Go, etc., adapt the extension match and test-file derivation below.
#
# Skips: test files themselves, type declarations, config files, entry
# points/barrel exports, and infra/tooling paths. For existing files that
# already have a test file on disk, the hook passes even if the test isn't
# staged in THIS commit — the test exists, so TDD was followed at some point.

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

if ! echo "$COMMAND" | grep -qE 'git\s+commit'; then
  exit 0
fi

# Skip merge commits — `git diff --cached` during a merge includes every file
# from the incoming branch, not just files this commit introduces.
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null || echo "")
if [ -n "$GIT_DIR" ] && [ -f "$GIT_DIR/MERGE_HEAD" ]; then
  exit 0
fi

STAGED=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null || echo "")
if [ -z "$STAGED" ]; then
  exit 0
fi

MISSING=""

while IFS= read -r file; do
  case "$file" in
    *.ts|*.tsx) ;;
    *) continue ;;
  esac

  case "$file" in
    *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) continue ;;
    *.e2e.test.ts|*.e2e.test.tsx) continue ;;
  esac

  case "$file" in
    *.d.ts|*vite-env.d.ts) continue ;;
    */types.ts|*/types.tsx|*/types/*) continue ;;
  esac

  case "$file" in
    */test/*|*/tests/*|*/__tests__/*|e2e/*) continue ;;
  esac

  case "$file" in
    *tsconfig*|*vite.config*|*vitest.config*|*.config.ts|*.config.tsx) continue ;;
    *tailwind*|*postcss*|*eslint*|*prettier*) continue ;;
  esac

  case "$(basename "$file")" in
    index.ts|index.tsx) continue ;;
    main.ts|main.tsx|bootstrap.tsx) continue ;;
    App.tsx|routes.tsx|entry.tsx) continue ;;
  esac

  case "$file" in
    */generated/*|*/codegen/generated/*) continue ;;
  esac

  case "$file" in
    .claude/*|scripts/*) continue ;;
  esac

  dir=$(dirname "$file")
  base=$(basename "$file")
  ext="${base##*.}"
  name="${base%.*}"
  test_file="$dir/$name.test.$ext"
  alt_test_file="$dir/__tests__/$name.test.$ext"

  found=0
  for candidate in "$test_file" "$alt_test_file"; do
    if [ -f "$candidate" ] || echo "$STAGED" | grep -qF "$candidate"; then
      found=1
      break
    fi
  done
  if [ "$found" -eq 0 ]; then
    MISSING="$MISSING\n  $file -> missing $test_file (or $alt_test_file)"
  fi
done <<< "$STAGED"

if [ -n "$MISSING" ]; then
  echo "ERROR: TDD violation — source files staged without corresponding test files:" >&2
  echo -e "$MISSING" >&2
  echo "" >&2
  echo "Write failing tests FIRST (red), then implement (green). See the tdd skill for the full protocol." >&2
  exit 2
fi

exit 0
