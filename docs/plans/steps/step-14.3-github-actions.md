# Step 14.3: GitHub Actions secret (manual)

## Objective
Make the GitHub repo deploy-ready for Fly: add the single `FLY_API_TOKEN` secret the
deploy workflow (written in 14.4) uses.

## Type
**Manual runbook** — no code change. This step file is the plan-level tracker.

## Runbook
→ [docs/deployment/03-github-actions.md](../../deployment/03-github-actions.md)

## Context
- Remote: `github.com/athollt/doubles-squash-ranking` (`origin`).
- **Fly model is much simpler than the old Hetzner one**: `fly deploy` builds remotely
  on Fly and reads runtime config from **Fly secrets** (set in 14.2), so GitHub needs
  **only** a deploy token — no GHCR, no SSH key, no app secrets in GitHub.
- Consumes the `FLY_API_TOKEN` produced by 14.2. The workflow YAML is part of **14.4**.

## Completion (acceptance)
- `git remote -v` confirms the GitHub origin.
- Repository secret **`FLY_API_TOKEN`** present (Settings → Secrets and variables →
  Actions).
- `main` confirmed as the deploy-triggering branch.

> No app code or tests change in this step. Record completion in `CHANGELOG.md`.
