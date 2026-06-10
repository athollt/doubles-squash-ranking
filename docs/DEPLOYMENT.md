# Deployment — Fly.io (Johannesburg)

Runtime guide for operating the live app. **Hosting decision and rationale:**
[DECISIONS.md ADR-008](plans/DECISIONS.md). **One-time account/infra setup** lives in
the runbooks — don't repeat it here:

- [`deployment/01-google-oauth.md`](deployment/01-google-oauth.md) — Google Cloud OAuth client.
- [`deployment/02-fly.md`](deployment/02-fly.md) — Fly app, Postgres, secrets, domain/TLS, backups.
- [`deployment/03-github-actions.md`](deployment/03-github-actions.md) — the `FLY_API_TOKEN` CI secret.

## What's deployed

- **App**: `rungs-app`, region `jnb`, always-on (single machine,
  `min_machines_running = 1`, `auto_stop_machines = "off"` — no cold starts).
- **Database**: unmanaged Fly Postgres `rungs-db` in `jnb`, attached →
  `DATABASE_URL` secret (private `.flycast`, `sslmode=disable`).
- **Domain/TLS**: `https://app.rungs.co.za` (Route 53 `CNAME app → rungs-app.fly.dev`),
  Let's Encrypt cert auto-renewed by Fly.

> Renamed off `bsc-squash-ladder` / `squash.tomlinson.co.za` at the Rungs cutover
> (plan step 25). The old app + DB were retired once the new app was verified.
- **Runtime config**: Fly secrets (`fly secrets list`), not a `.env` file —
  `DATABASE_URL`, `AUTH_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## How a deploy works

1. **Push to `main`** → GitHub Actions (`.github/workflows/fly-deploy.yml`) runs
   `flyctl deploy --remote-only` using the `FLY_API_TOKEN` secret. Image builds on Fly's
   remote builder from the [`Dockerfile`](../Dockerfile) (multi-stage, Next.js
   standalone, `next build --webpack` so the Serwist PWA service worker is emitted).
2. **Release command** — before new machines take traffic, `fly.toml`'s
   `[deploy] release_command = "npx prisma migrate deploy"` runs once against the
   production DB. A failed migration aborts the release; the old machine keeps serving.
3. **Cutover** — the new machine starts (`node server.js`, port 3000), passes the
   `GET /` health check, then takes traffic.

Deploy manually from your machine with the same flow:

```bash
fly deploy            # uses fly.toml in the repo root
```

## First production deploy (one-time)

The DB starts empty — no admin is seeded by a deploy. **After the first deploy, seed the
first admin** or every Google sign-in lands on `/unauthorised`:

```bash
fly ssh console -C "npx prisma db seed"
```

This seeds the 15 default settings + admin `atholl@tomlinson.co.za` (idempotent).
Production sign-in is Google only — the seeded credentials password is irrelevant there.

## Day-to-day operations

```bash
fly status                       # machine health, current release, region
fly logs                         # live app + release-command logs
fly ssh console                  # shell into the running machine
fly secrets list                 # names of runtime secrets (values masked)
fly secrets set KEY=value        # set/rotate a secret (triggers a restart)
```

## Migrations

Migrations are **not** run by hand in production — they run via the release command on
every deploy. To add one: create it locally (`npx prisma migrate dev --name <x>`), commit
it under `prisma/migrations/`, and the next push to `main` applies it via
`prisma migrate deploy`.

## Rolling back

```bash
fly releases                     # list releases (vN) with image refs
fly deploy --image <previous>    # redeploy a prior image
```

Note a rollback does **not** revert a migration that already ran — Prisma migrations are
forward-only. If a release's migration is the problem, roll forward with a fixing
migration rather than reverting the image alone.

## Database backups & restore

Backups are Fly **volume snapshots** of `pg_data` (scheduled daily, ~5-day retention —
see runbook 02). To restore:

```bash
fly volumes snapshots list <volume-id>          # find a snapshot
fly volumes create pg_data --snapshot-id <id> --region jnb
# then attach/point the Postgres machine at the restored volume (see runbook 02)
```

A `pg_dump` → object-storage cron is a deferred hardening option (ADR-008).

## Token hygiene

CI uses a deploy-scoped token (GitHub secret `FLY_API_TOKEN`). Your local `fly` CLI uses a
separate personal token. Rotate with `fly tokens create deploy` / `fly tokens revoke`; list
with `fly tokens list`.
