# Delete & Move — Always Confirm First

Deleting or moving/renaming a file or directory always requires the user's
explicit go-ahead first — no matter which permission mode the session is
running in (default, acceptEdits, auto, or bypassPermissions). This is a
non-negotiable guardrail: never fire off a delete/move as a side effect of
"cleaning up" or "simplifying" without asking first.

## Enforcement

`.claude/settings.json` -> `permissions.ask` lists the destructive command
patterns (`rm`, `rmdir`, `unlink`, `mv`, `git rm`, `git mv` for Bash;
`Remove-Item`/`ri`/`rd`/`del`/`erase`/`rmdir`/`rm`, `Move-Item`/`mi`/`move`/`mv`,
`Rename-Item`/`rni`/`ren` for PowerShell). Per Claude Code's permission
system, an explicit `ask` rule still forces a prompt even under
`bypassPermissions` — only `deny` rules and explicit `ask` rules survive
that mode. Never remove or weaken these entries to work around a stuck
prompt; if a prompt seems wrong, ask the user, don't edit the rule away.

## What the rule list can't catch

The `ask` rules only match literal Bash/PowerShell command patterns — they
don't cover deletion/move performed from inside code you write (e.g.
`os.remove`, `fs.unlink`, `shutil.rmtree`, `git clean`). For those paths,
explicitly ask the user in your own response before running them — don't
rely on the settings rule to catch what it structurally can't see.

## Load this rule when

- About to run any command, or write any code, that deletes, moves, or
  renames a file or directory.

## Skip when

- Read-only operations (reading, listing, grepping).
- The user has already explicitly named the exact file(s) to delete/move in
  the current request — the settings prompt still fires for the actual
  command; this just means don't ask a second time in prose before issuing it.
