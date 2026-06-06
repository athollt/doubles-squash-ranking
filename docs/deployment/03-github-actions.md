# Deployment Runbook 03 — GitHub repo & Actions secrets

**Step**: 14.3 · **Owner**: you (manual) · **Gates**: 14.4 (deployment)
**Goal**: make the GitHub repo ready for the deploy pipeline — confirm the remote,
enable GHCR, and populate every Actions Secret the workflow reads. This is pure glue:
it consumes the outputs of [01-google-oauth.md](01-google-oauth.md) and
[02-hetzner.md](02-hetzner.md).

The deploy **workflow file** (`.github/workflows/deploy.yml`) is *written by step 14.4*
(it's code). This runbook only ensures the repo + secrets it depends on exist.

---

## Prerequisites

- Repo already on GitHub: **github.com/athollt/doubles-squash-ranking** (`origin`).
- Outputs from runbooks 01 and 02 in hand.
- Admin access to the repo's **Settings**.

---

## Steps

### 1. Confirm the remote
```bash
git remote -v
# origin  https://github.com/athollt/doubles-squash-ranking.git
```

### 2. GHCR (GitHub Container Registry)
The workflow pushes the image to `ghcr.io/athollt/doubles-squash-ranking` using the
built-in `GITHUB_TOKEN`. No PAT needed for same-repo pushes, but:
1. **Settings → Actions → General → Workflow permissions** → set **Read and write
   permissions** (so `GITHUB_TOKEN` can push packages).
2. After the first successful push, the package appears under the user's **Packages**.
   Confirm its visibility (private is fine — the VPS pulls it via the deploy step using
   the same token context, or make it public if you prefer simpler pulls).

### 3. Add repository secrets
**Settings → Secrets and variables → Actions → New repository secret**. Add each:

| Secret | Value (source) |
|---|---|
| `VPS_HOST` | VPS public IPv4 (runbook 02) |
| `VPS_SSH_KEY` | contents of `~/.ssh/squash_deploy` — the **private** key (runbook 02) |
| `AUTH_SECRET` | `openssl rand -base64 32` value in the VPS `.env` (runbook 02) |
| `DATABASE_URL` | `postgresql://postgres:<DB_PASSWORD>@postgres:5432/squash` (runbook 02) |
| `DB_PASSWORD` | the Postgres password (runbook 02) |
| `GOOGLE_CLIENT_ID` | from runbook 01 |
| `GOOGLE_CLIENT_SECRET` | from runbook 01 |

> The VPS `.env` is the runtime source of truth for the *containers*; these GitHub
> Secrets are what the **workflow** needs (to SSH in and, where applicable, to build).
> Keep the two in sync — if you rotate `AUTH_SECRET`, update both (rotating it logs
> everyone out — RESEARCH §2 gotcha 2).

### 4. Branch & trigger sanity check
- The workflow triggers on **push to `main`** (step 14.4). Confirm `main` is the
  default/protected branch and that merges to it are intended to deploy.
- Paste the `VPS_SSH_KEY` exactly (including the `-----BEGIN/END-----` lines and the
  trailing newline) — a truncated key is the most common deploy failure.

---

## Outputs

All secrets present in the repo, GHCR write enabled. Step **14.4** can now add
`.github/workflows/deploy.yml` and the first push to `main` will build → push →
SSH-deploy → migrate.
