# Banyan Project Memory

## User Preferences

- **Always use `tsc` for typechecking** — `tsgo` causes OOM crashes on this machine. Run `bunx tsc --noEmit -p tsconfig.json`. (Reversed from earlier guidance; user clarified 2026-05-21.)
- **Always use git worktrees** for any new work. Use `EnterWorktree` tool (or `claude --worktree` flag) to create worktrees — never `git worktree add` directly. After `EnterWorktree`, run `bash scripts/setup-worktree.sh`. For cleanup, use `bash scripts/remove-worktree.sh`. Use `isolation: "worktree"` for subagents. Never work directly on `main`.
- **Git commit authorship**: Use `--author="Claude Code <noreply@anthropic.com>"` flag on `git commit`. Put `Co-Authored-By: deathemperor <deathemperor@gmail.com>` in the message body. Do NOT put `Author:` in the message body.
- **Always rebase, never merge** — use `git rebase` to integrate upstream changes, `gh pr merge --rebase --admin` for PRs. No merge commits.
- **Merge PRs with `--admin`** when branch protection blocks merge
- **Always execute deployment/build steps yourself** — never tell the user to run something you can run. Do it, don't suggest it.
- **NEVER implement fallbacks** — fail fast, fail loud. No degraded alternatives, no silent catch-and-continue, no default values to paper over missing data. Fix the root cause instead. See `.claude/rules/no-fallbacks.md`.

## Architecture Rules


## Key Facts


## Deployment


## Infrastructure

## Schema & Domain


## Project

<!-- - [Apple audit-log permission gap — policyholder-viewed dependent claims get empty action_logs](project_apple_audit_log_permission_gap.md) — Phoenix timeline shows no times (SIT + prod); fix is metadata-only in the apple repo; `decision_at` is null even on decided TCL claims (only `approved_at` is written). -->
## Tooling

<!-- - [security-guidance plugin blocks Write/Edit on banned substrings](reference_security_guidance_plugin.md) — `⚠️ Security Warning` exit-2 noise, deduplicated per-session per-file per-rule
- [Codex-coder accumulated patterns](../agent-memory/codex-coder/MEMORY.md) — committed memory for the codex-coder Codex sub-agent -->

## Feedback

- [Audit every technical term before using it](feedback_precise_terminology.md) — no sloppy or ambiguous terms; specify scope for words like "shared", "local", "common"; describe the mechanism in plain English when no established term fits.
- [Fix-scope minimality — behavior, not just text](feedback_fix_scope_minimality.md) — make the smallest behavioral change, not the smallest text change. When shared state sits between the bug and the code, a one-line text edit can have multi-path behavioral impact.
(feedback_drone_single_policy.md)
- [Never skip tests in subagent prompts — TDD is mandatory](feedback_never_skip_tests.md)
- [All memories in repo .claude/memory/, never in ~/.claude/projects/](feedback_repo_memories.md)
- [Persist all selectable UI state in URL search params, not useState](feedback_url_params_state.md)
- [Test scripts — don't pass a PDF unless explicitly asked, use script default](feedback_test_script_pdf_default.md)
- [Worktree teardown — use ExitWorktree tool, not the bash script](feedback_exit_worktree_tool.md) — bash script leaves session state stale; ExitWorktree owns the lifecycle
- [Post-merge sequence is pre-authorized — execute, don't ask](feedback_post_merge_sequence.md) — `.claude/rules/post-merge-worktree-cleanup.md` labels it "mandatory, pre-authorized"; the general "ask before destructive" heuristic doesn't apply when a rule names the action + parameters
- [Codex-coder routing belongs to the main agent](feedback_codex_coder_routing.md) — token-efficiency exceptions guide whether the main agent launches `@codex-coder`; they never permit the router to Write/Edit/Read after launch
- [Export the actual SVG from Figma — never approximate with Material/Cupertino](feedback_export_figma_svg_for_icons.md) — use `mcp__TalkToFigma__export_node_as_image` with `format: "SVG"`, bundle as asset; Material icons are close-but-wrong and produce visible regressions on design review
<!-- - [Oasis docs are the single source of truth](feedback_oasis_docs_single_source.md) — never create standalone `.md` deliverable files alongside the in-app docs -->
<!-- - [Parallelize Linear sub-agents for independent writes](feedback_parallel_linear_subagents.md) — N parallel sub-agents finish in time of the slowest, not the sum; only serialize when one call's output feeds the next -->
<!-- - [CodeBuild buildspec parser rejects `: ` in unquoted `- ` command one-liners](feedback_codebuild_buildspec_colon_space.md) — PyYAML accepts it, CodeBuild doesn't; use `- |` blocks. Broke cosmo CI in #1752, hotfixed in #1754; guard: ci/__tests__/buildspec-codebuild-safe.bats. -->

## Frontend Testing Convention

- **Use Vitest + React Testing Library** for component/unit tests, NOT Playwright/e2e