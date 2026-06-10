# Deployment Runbook 03 — GitHub Actions secret (Fly)

**Step**: 14.3 · **Owner**: you (manual) · **Gates**: 14.4 (deployment)
**Goal**: add the one secret the Fly deploy workflow needs. With Fly, this step is tiny:
`fly deploy` builds remotely on Fly and reads runtime config from **Fly secrets** (set
in runbook 02), so GitHub Actions needs **only** a deploy token — no GHCR, no SSH key,
no app secrets duplicated into GitHub.

The deploy **workflow file** (`.github/workflows/deploy.yml`) is *written by step 14.4*.
This runbook only adds the secret it reads.

---

## Prerequisites

- Repo on GitHub: **github.com/athollt/doubles-squash-ranking** (`origin`).
- `FLY_API_TOKEN` from [02-fly.md](02-fly.md) step 7 (`fly tokens create deploy …`).
- Admin access to the repo's **Settings**.

---

## Steps

### 1. Confirm the remote
```bash
git remote -v
# origin  https://github.com/athollt/doubles-squash-ranking.git
```

### 2. Add the deploy token secret
**Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value (source) |
|---|---|
| `FLY_API_TOKEN` | the deploy token from runbook 02 step 7 |

> That's the only secret needed. `AUTH_SECRET`, `GOOGLE_CLIENT_*`, and `DATABASE_URL`
> live in **Fly secrets** (runbook 02), not GitHub — the running app reads them from
> Fly at runtime; the CI job only needs to authenticate `flyctl`.

> **The token is app-scoped.** A `fly tokens create deploy --app <name>` token only
> authorises *that* app. When the app was renamed `bsc-squash-ladder → rungs-app`
> (step 25), the old token started failing CI with `Error: unauthorized` (then, after a
> truncated copy, `missing third-party discharge token`). Fix: create a new token for the
> current app and replace the secret value **whole** — copy without hand-selecting in the
> terminal (truncation drops the discharge token), e.g.
> `fly tokens create deploy --app rungs-app --json | jq -r .token | pbcopy`. Revoke the
> stale token afterwards (`fly tokens revoke <id>`).

### 3. Confirm the deploy branch
- The workflow triggers on **push to `main`** (step 14.4). Confirm `main` is the
  default/protected branch and that merges to it are intended to deploy.

---

## Outputs

`FLY_API_TOKEN` present in the repo. Step **14.4** adds `.github/workflows/deploy.yml`
and the first push to `main` runs `flyctl deploy`.
