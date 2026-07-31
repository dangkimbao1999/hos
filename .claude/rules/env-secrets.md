# Secrets & Environment Variables

`.env` is a **temporary, gitignored file** — never a source of truth.

## Rules

- **Never hardcode secrets** in `.env`, source files, or commits
- **Never symlink or copy** `.env` from another checkout — each worktree
  generates its own
- <Fill in once you pick a secret store: "Always generate `.env` by running
  `bash scripts/onboard.sh`, which pulls from <AWS SSM / GCP Secret Manager /
  Doppler / 1Password>.">
- **Regenerate** whenever secrets change or a new worktree is created

## Secret storage hierarchy (fill in once decided)

| Location | Purpose |
|----------|---------|
| <your secret store> (e.g. AWS SSM Parameter Store) | Primary — all secrets live here |
| `.env` (local only) | Ephemeral — generated from the secret store, never committed |
| CI secrets (e.g. GitHub Actions secrets) | For pipeline credentials |

## Skip this rule when

- Working on non-secret config (ports, feature flags, public URLs)
- Reading or explaining code — no `.env` changes needed
