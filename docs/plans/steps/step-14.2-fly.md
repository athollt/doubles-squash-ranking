# Step 14.2: Fly.io production environment (manual)

## Objective
Provision the production app and database on Fly.io in **Johannesburg (jnb)**: the Fly
app, unmanaged Postgres (co-located in jnb), production secrets, custom domain + TLS,
and a CI deploy token — everything the running app needs except the first `fly deploy`
(that's 14.4).

## Type
**Manual runbook** — no code change. This step file is the plan-level tracker.

## Runbook
→ [docs/deployment/02-fly.md](../../deployment/02-fly.md)

## Context
- **Switched from Hetzner to Fly.io.** The plan's original "Hetzner Cape Town" was a
  wrong fact — Hetzner has no SA datacenter, so it couldn't deliver the ZA latency it
  was chosen for. Fly's **jnb** region is the only option that puts the app in South
  Africa (~10–30ms vs ~150–180ms from Hetzner EU). See `RESEARCH-flyio-vs-hetzner.md`
  and the CHANGELOG step 14.2 decision note.
- **Postgres**: unmanaged Fly Postgres in jnb (co-located). Fly has **deprecated** and
  no longer supports unmanaged Postgres; accepted for a small club app, with volume
  snapshots for DR. (Managed Postgres isn't in jnb and starts at $38/mo — rejected.)
- **Always-on**, single machine (no scale-to-zero) — instant ladder, no cold starts.
- Depends on 14.1 (needs the Google credentials for Fly secrets).
- Domain `squash.tomlinson.co.za`.

## Completion (acceptance)
- `fly launch --no-deploy` ran; app `bsc-squash-ladder` exists in region `jnb`.
- Postgres `bsc-squash-db` created in jnb and **attached** (`DATABASE_URL` secret set —
  `fly secrets list` confirms).
- Secrets set: `AUTH_URL=https://squash.tomlinson.co.za`, fresh `AUTH_SECRET`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- DNS points `squash` at the app; `fly certs show squash.tomlinson.co.za` is issued/valid.
- Volume snapshots confirmed (default daily retention); restore path noted.
- `FLY_API_TOKEN` deploy token created and recorded for 14.3.

> No app code or tests change in this step. `fly.toml`/`Dockerfile` are generated here
> but finalised + committed in 14.4. Record completion in `CHANGELOG.md`.
