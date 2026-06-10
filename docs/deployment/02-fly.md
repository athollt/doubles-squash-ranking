# Deployment Runbook 02 — Fly.io production environment

**Step**: 14.2 · **Owner**: you (manual) · **Gates**: 14.4 (deployment)
**Goal**: stand up the production app + database on Fly.io in **Johannesburg (jnb)** —
the Fly app, the Postgres database, the production secrets, and the custom domain/TLS —
everything the running app needs *except* the first real `fly deploy` (that's 14.4).

> **Rungs cutover (plan step 25):** the live app is now **`rungs-app`** + **`rungs-db`**
> at **`https://app.rungs.co.za`** (`CNAME app → rungs-app.fly.dev`). The commands below
> were originally run for `bsc-squash-ladder` / `bsc-squash-db` / `squash.tomlinson.co.za`;
> the cutover re-ran the same steps with the new names against a **fresh DB** (re-seeded,
> no data copy), then retired the old app + DB. Substitute the new names when reading.

> **Why Fly (and the correction that led here):** the plan originally specified Hetzner
> Cloud "Cape Town". That was a **wrong fact** — Hetzner has **no South Africa
> datacenter** (only EU + US + Singapore), so it can't beat ~150–180ms to ZA users.
> Fly.io's **jnb** region is the only option on the table that actually puts the app in
> South Africa (~10–30ms). See `RESEARCH-flyio-vs-hetzner.md` and the CHANGELOG step
> 14.2 decision note. Trade-off accepted: unmanaged Fly Postgres is **deprecated/
> unsupported** by Fly (see step 3) — acceptable for a small club app with volume
> snapshots for DR.

This runbook produces the single value used by [03-github-actions.md](03-github-actions.md):

- `FLY_API_TOKEN` (a deploy token for the GitHub Actions workflow)

…plus the production secrets, which live in **Fly secrets** (not a VPS `.env`).

---

## Prerequisites

- A **Fly.io** account (<https://fly.io>) with a payment method (pay-as-you-go; no free
  tier for new accounts).
- **flyctl** installed locally and authenticated:
  ```bash
  brew install flyctl        # macOS
  fly auth login
  fly auth whoami            # confirm
  ```
- Access to DNS for **tomlinson.co.za** (to point `squash` at Fly).
- Completed [01-google-oauth.md](01-google-oauth.md) — you have the Google client
  ID/secret to set as Fly secrets.

---

## Steps

### 1. Launch the app (no deploy yet)
From the repo root:
```bash
fly launch --no-deploy --region jnb --name bsc-squash-ladder
```
- `--no-deploy`: create the app + generate `fly.toml`/`Dockerfile` without deploying
  (the real deploy is 14.4, after `fly.toml` is finalised and committed).
- `--region jnb`: Johannesburg — the whole point of this move.
- `--name`: the Fly app name (globally unique; adjust if taken).
- When prompted to set up a database/Redis, **say no** — we create Postgres explicitly
  in step 3 so it lands in `jnb` and is attached deliberately.

`fly launch` detects Next.js and writes a `fly.toml` + `Dockerfile`. **Do not commit
them yet** — step 14.4 finalises `fly.toml` (always-on settings, internal port) and the
Dockerfile (standalone output), and commits them as part of the deploy step.

> If `fly launch` won't run without deploying in your flyctl version, use
> `fly apps create bsc-squash-ladder --org personal` then hand-author `fly.toml` in 14.4.

### 2. Confirm `output: "standalone"`
Already set in `next.config.ts` (CHANGELOG step 01). Fly's Dockerfile generator uses it
to produce a small image. Nothing to do — just verify it's still there.

### 3. Create the Postgres database (in jnb) and attach it
> ⚠️ **Unmanaged Fly Postgres is deprecated and NOT supported by Fly.io** — `fly
> postgres create` still works, but you own ops/backups/upgrades/DR. We accept this for
> a small club app; backups are covered by volume snapshots (step 6). Fly steers you to
> **Managed Postgres** (`fly mpg`), but MPG is **not available in jnb** (nearest ~150ms)
> and starts at $38/mo — both defeat the reason for moving. Decision recorded.

```bash
fly postgres create --name bsc-squash-db --region jnb \
  --vm-size shared-cpu-1x --volume-size 1 --initial-cluster-size 1
```
- `--region jnb`: co-located with the app (~0ms app↔DB).
- `--volume-size 1` (GB): plenty for this dataset; grow later with `fly volumes extend`.
- `--initial-cluster-size 1`: single node (no HA replica — fine at this scale/cost).

Attach it to the app — this **creates the `DATABASE_URL` secret automatically**:
```bash
fly postgres attach bsc-squash-db --app bsc-squash-ladder
```
Verify: `fly secrets list --app bsc-squash-ladder` shows `DATABASE_URL`.

> The generated `DATABASE_URL` points at the internal `.flycast`/`.internal` address —
> app↔DB stays on Fly's private network, not the public internet.

### 4. Set the production secrets
```bash
fly secrets set --app bsc-squash-ladder \
  AUTH_URL=https://squash.tomlinson.co.za \
  AUTH_SECRET="$(openssl rand -base64 32)" \
  GOOGLE_CLIENT_ID=<from runbook 01> \
  GOOGLE_CLIENT_SECRET=<from runbook 01>
```
- `AUTH_SECRET`: generate fresh for production (don't reuse the local dev one; changing
  it later logs everyone out).
- `DATABASE_URL` is already set by the attach in step 3 — do **not** set it manually.
- Secrets are encrypted at rest and injected as env vars at runtime; there is **no VPS
  `.env`** in this model.

### 5. Custom domain + TLS
1. DNS for `tomlinson.co.za` — point `squash` at the app. Fly gives you the exact
   records; typically:
   ```
   CNAME  squash  bsc-squash-ladder.fly.dev.
   ```
   (or A/AAAA to the app's Fly IPs — `fly ips list` shows them). A CNAME is simplest.
2. Issue the cert (auto Let's Encrypt, managed + renewed):
   ```bash
   fly certs add squash.tomlinson.co.za --app bsc-squash-ladder
   fly certs show squash.tomlinson.co.za --app bsc-squash-ladder   # check status
   ```
   > The cert validates once DNS resolves. The **production Google sign-in proof** (the
   > real-domain OAuth check) happens in 14.4 after the first deploy makes the app live.

### 6. Backups — volume snapshots
Fly automatically snapshots volumes daily; confirm the retention and note the restore
path:
```bash
fly volume show <volume-id> --app bsc-squash-db
#   → "Scheduled snapshots: true", "Snapshot retention: 5" (days)
fly volume snapshots list <volume-id> --app bsc-squash-db   # (empty for the first ~day)
```
**Restore (disaster recovery)** — new volume from a snapshot, then a new PG machine:
```bash
fly volume snapshots list <volume-id> --app bsc-squash-db        # find <snap-id>
fly volume create pg_data --snapshot-id <snap-id> --region jnb --app bsc-squash-db
```
> For v1 this is the agreed backup strategy. A belt-and-braces `pg_dump`→object-storage
> cron can be added as a later hardening step if the data justifies it.

### 7. Create the deploy token (for CI)
```bash
fly tokens create deploy --app bsc-squash-ladder --name github-actions
```
Copy the printed token — this is `FLY_API_TOKEN` for runbook 03 (GitHub Secret). It is
scoped to deploying this app only.

---

## Outputs (carry forward to 14.3 / 14.4)

| Value | Used in |
|---|---|
| `FLY_API_TOKEN` (deploy token) | GitHub Secret (14.3) |
| Fly app name (`bsc-squash-ladder`) + region `jnb` | `fly.toml` (14.4) |
| Postgres attached (`DATABASE_URL` secret set) | runtime |
| `AUTH_URL` / `AUTH_SECRET` / Google creds | Fly secrets (set above) |
| `squash.tomlinson.co.za` cert issued | verified live in 14.4 |
