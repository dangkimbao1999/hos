# Testing Checklist

Before marking any task as complete, verify the appropriate tests exist.

## For new modules/functions:
- [ ] Unit tests alongside the code (or in its `__tests__/` directory)
- [ ] Integration/E2E test if the change crosses a user-facing boundary

## For bug fixes:
- [ ] Regression test that reproduces the bug (fails without the fix)
- [ ] Test passes with the fix

## For new hooks (`.claude/hooks/*.sh`):
- [ ] A test for the hook's core behavior (bats, or a small shell harness)

## For dependency/config changes:
- [ ] Typecheck / build passes
- [ ] Existing test suite still green

Load this rule when:
- Completing any task
- Reviewing PRs
- Before creating a PR

Skip when:
- Documentation-only changes
- Config/infra changes with no logic
