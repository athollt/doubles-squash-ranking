# Step 14.2: Hetzner production environment (manual)

## Objective
Provision the production VPS and everything the running app needs except the app image:
the CX22 server, DNS, deploy user + SSH key, firewall, the production `.env` with
generated secrets, and the Object Storage backup bucket.

## Type
**Manual runbook** — no code change. This step file is the plan-level tracker.

## Runbook
→ [docs/deployment/02-hetzner.md](../../deployment/02-hetzner.md)

## Context
- Hetzner Cloud CX22, Cape Town, Ubuntu 24.04 (RESEARCH §7).
- Domain `squash.tomlinson.co.za`.
- Depends on 14.1 (needs the Google credentials for `.env`).
- First `docker compose up` / migrate / seed is **not** here — it happens in 14.4 once
  the compose/Dockerfile/Caddyfile exist. This step only prepares the host.

## Completion (acceptance)
- CX22 reachable; `deploy` user can `docker ps` over its dedicated SSH key.
- `dig +short squash.tomlinson.co.za` returns the VPS IP.
- Firewall allows only 22/80/443.
- `/home/deploy/squash/.env` populated with production values (`AUTH_URL` =
  `https://squash.tomlinson.co.za`, generated `AUTH_SECRET`, `DB_PASSWORD`,
  `DATABASE_URL` via the `postgres` service name, Google credentials).
- Object Storage bucket + S3 credentials created.
- Outputs (`VPS_HOST`, `VPS_SSH_KEY`, secrets, S3 creds) recorded for 14.3 / 14.4.

> No app code or tests change in this step. Record completion in `CHANGELOG.md`.
