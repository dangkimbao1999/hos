#!/usr/bin/env bash
# No-fallbacks enforcement hook — blocks Edit/Write calls that introduce
# fallback/degraded-mode patterns. Scans new_string / content for banned
# fallback code. Registered for Edit and Write matchers in settings.json.
#
# False positives are possible — patterns are intentionally narrow. If this
# hook fires on genuinely correct code, tighten the regex rather than
# disabling the hook.

INPUT=$(cat)

PARSED=$(printf '%s' "$INPUT" | "$PY" -c "
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print(''); print(''); raise SystemExit
ti = d.get('tool_input', {}) or {}
fp = ti.get('file_path', '')
tool = d.get('tool_name', '')
if tool == 'Edit':
    code = ti.get('new_string', '') or ''
elif tool == 'Write':
    code = ti.get('content', '') or ''
elif tool == 'MultiEdit':
    code = '\n'.join((e or {}).get('new_string', '') for e in (ti.get('edits') or []))
else:
    code = ti.get('new_string', ti.get('content', '')) or ''
print(fp)
print(code.replace('\x00', ''))
" 2>/dev/null || printf '\n\n')

FILE_PATH=$(printf '%s' "$PARSED" | sed -n '1p')
CODE=$(printf '%s' "$PARSED" | sed -n '2,$p')

if [ -z "$CODE" ]; then
  exit 0
fi

case "$FILE_PATH" in
  *.md|*.json|*.yaml|*.yml|*.sh|*.css|*.html|*.sql|*.env*|*.lock|*.toml|*.conf)
    exit 0
    ;;
esac

VIOLATIONS=""

if echo "$CODE" | "$PY" -c "
import sys, re
code = sys.stdin.read()
patterns = [
    r'catch\s*(?:\([^)]*\))?\s*\{[^}]*(?:fallback|degrade|default|alternative|backup)',
]
for p in patterns:
    if re.search(p, code, re.IGNORECASE | re.DOTALL):
        sys.exit(1)
sys.exit(0)
" 2>/dev/null; then
  :
else
  VIOLATIONS="${VIOLATIONS}\n  - Catch block with fallback/degrade/alternative pattern"
fi

if echo "$CODE" | grep -qiE '(fall\s*back|degrade|graceful.*(fail|degrad))|try .*, if .* fails? .* try'; then
  VIOLATIONS="${VIOLATIONS}\n  - Comment or text describing fallback behavior"
fi

if echo "$CODE" | "$PY" -c "
import sys, re
code = sys.stdin.read()
patterns = [
    r'if\s*\(\s*!?\s*\w+\s*\)\s*\{[^}]*=\s*(?:await\s+)?\w+\(',
    r'if\s*\(\s*\w+\.length\s*===\s*0\s*\)\s*\{[^}]*=\s*(?:await\s+)?\w+\(',
    r'try\s*\{[^}]+\}\s*catch[^{]*\{[^}]*try\s*\{',
]
for p in patterns:
    if re.search(p, code, re.DOTALL):
        sys.exit(1)
sys.exit(0)
" 2>/dev/null; then
  :
else
  VIOLATIONS="${VIOLATIONS}\n  - Cascading try/catch or if-fail-then-try-different pattern"
fi

if [ -n "$VIOLATIONS" ]; then
  echo "BLOCKED [no-fallbacks]: Code contains fallback patterns that violate .claude/rules/no-fallbacks.md:" >&2
  echo -e "$VIOLATIONS" >&2
  echo "" >&2
  echo "Fix: fail fast and fail loud. If data is missing, throw. If an operation fails, surface the error — don't try a different operation." >&2
  exit 1
fi

exit 0
