# Step 14.3: GitHub repo & Actions secrets (manual)

## Objective
Make the GitHub repo deploy-ready: confirm the remote, enable GHCR write, and populate
every Actions Secret the deploy workflow (written in 14.4) will read.

## Type
**Manual runbook** — no code change. This step file is the plan-level tracker.

## Runbook
→ [docs/deployment/03-github-actions.md](../../deployment/03-github-actions.md)

## Context
- Remote: `github.com/athollt/doubles-squash-ranking` (`origin`).
- Consumes outputs of 14.1 (Google credentials) and 14.2 (VPS host/SSH key/secrets).
- The workflow YAML itself is part of **14.4** (code) — this step only provisions the
  repo settings and secrets it needs.

## Completion (acceptance)
- `git remote -v` confirms the GitHub origin.
- Workflow permissions set to **Read and write** (GHCR push via `GITHUB_TOKEN`).
- Repository secrets present: `VPS_HOST`, `VPS_SSH_KEY`, `AUTH_SECRET`, `DATABASE_URL`,
  `DB_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- `main` confirmed as the deploy-triggering branch.

> No app code or tests change in this step. Record completion in `CHANGELOG.md`.
