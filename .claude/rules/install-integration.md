# Installing MCP Servers, Skills & Plugins

Two entry points — full procedure in the `install-integration` skill:

- **Given a GitHub URL** — read the repo's README/manifest to determine
  whether it's an MCP server, a Claude Code plugin, or a standalone skill
  (don't guess the shape from the repo name), then install via the
  matching mechanism.
- **Given only a name, no link** — look up the name in already-added
  plugin marketplaces (`claude plugin marketplace list`) and Anthropic's
  official marketplace (`anthropics/claude-plugins-official`) first. If
  it isn't listed there, **stop and ask the user** to confirm/provide the
  actual source — never fabricate a plausible-looking GitHub repo for an
  unverified name (see the "never generate/guess URLs" system rule).

MCP servers go in this repo's committed `.mcp.json` (shared, team-wide)
plus each developer's own `enabledMcpjsonServers` in
`.claude/settings.local.json` (personal, gitignored) — see the `stitch`
entry for the reference pattern. Plugins install globally per-developer
via `claude plugin marketplace add` / `claude plugin install` (not
git-tracked) — document the install command in a rule file the way
`.claude/rules/stitch-design.md` documents the `stitch-skills` plugin, so
teammates know it exists even though nobody's install is inherited by
anyone else.

Installing an MCP server means running a third-party package's code
locally (`bunx`/`npx` or similar) — treat it like any other new dependency:
skim the source/README first, and confirm with the user before the first
execution of an unfamiliar package.

## Load this rule when

- The user asks to add/install a new MCP server, skill, or plugin.
- A GitHub URL is given specifically to be installed.

## Skip when

- Just browsing/reading about an integration, not installing it.
- Already-installed integrations — no new install requested.
