# Step 14.4: Deployment setup (Fly.io)

## Objective
Finalise the Fly deployment config (`fly.toml` + Dockerfile), add the GitHub Actions
deploy workflow and deployment docs, then perform the **first production deploy** and
verify real Google sign-in on the live domain.

## Depends on
- **14.1** Google OAuth credentials exist (redirect URI for `squash.tomlinson.co.za`
  registered).
- **14.2** Fly app + Postgres (jnb) provisioned; secrets set; domain cert issued;
  `FLY_API_TOKEN` created.
- **14.3** `FLY_API_TOKEN` added as a GitHub Actions secret.
- **13.5** Redesign rollout complete (deploy the final UI, not the baseline).

## Context
- **Hosting: Fly.io, Johannesburg (jnb)** — app + unmanaged Postgres co-located in SA.
  (Replaces the original Hetzner plan; see `RESEARCH-flyio-vs-hetzner.md` and CHANGELOG
  step 14.2.)
- Auth.js v5 env names (`AUTH_URL`/`AUTH_SECRET`); runtime config comes from **Fly
  secrets** (14.2), not a VPS `.env`.
- `output: "standalone"` already set in `next.config.ts` (step 01).

## Specification

### `fly.toml` (finalise what `fly launch` generated):
- `app = "bsc-squash-ladder"`, `primary_region = "jnb"`.
- `[http_service]`: `internal_port = 3000`, `force_https = true`, and **always-on**:
  `auto_stop_machines = "off"`, `auto_start_machines = true`, `min_machines_running = 1`.
- A health check (`GET /`).
- `[[vm]]` `size = "shared-cpu-1x"` (bump memory to 512MB–1GB if the Next.js server
  needs it under build/runtime — start at 256/512 and watch).
- **Release command for migrations**: `[deploy] release_command = "npx prisma migrate
  deploy"` — runs once per deploy, before the new machines take traffic (replaces the
  old SSH `migrate deploy`).

### Dockerfile (finalise the generated one):
- Multi-stage (builder + runner), Next.js **standalone** output.
- `npx prisma generate` at build time.
- Final stage runs `node server.js` on port 3000.

### GitHub Actions workflow (`.github/workflows/deploy.yml`):
- Trigger: push to `main`.
- `superfly/flyctl-actions/setup-flyctl` → `flyctl deploy --remote-only`.
- Auth via `FLY_API_TOKEN` (the only secret). No GHCR, no SSH. Migrations run via the
  `release_command`, not a separate step.

### Documentation:
- `docs/DEPLOYMENT.md` — Fly *runtime* guide: `fly deploy`, how the release command
  migrates, `fly logs` / `fly status` / `fly ssh console`, seeding the first admin
  (`fly ssh console -C "npx prisma db seed"` or a one-off `fly machine run`), volume
  snapshot/restore, and rolling back (`fly releases` / `fly deploy --image <prev>`).
  Prerequisite account setup lives in `docs/deployment/01..03` (steps 14.1–14.3) —
  reference, don't duplicate.

### `.env.example` update:
- Reconcile comments to the Fly model (secrets set via `fly secrets`, `DATABASE_URL`
  set by `fly postgres attach`); keep the local-dev values intact.

**Behaviours to verify (TDD order):**
1. `docker build .` succeeds (the Fly Dockerfile builds locally).
2. `fly config validate` passes for `fly.toml`.
3. GitHub Actions workflow YAML is valid (lint with `actionlint` if available).
4. `.env.example` accurately documents required variables for the Fly model.

**Production verification (completion proof — first live deploy):**
5. Push to `main` → workflow runs `flyctl deploy`; the release command runs
   `prisma migrate deploy`; new machine takes traffic.
6. `https://squash.tomlinson.co.za` serves over the valid Fly-issued (Let's Encrypt)
   TLS cert.
7. First admin seeded (`atholl@tomlinson.co.za` in the `users` table).
8. **Real Google sign-in on the live domain**: sign in as `atholl@tomlinson.co.za` →
   land signed-in with Admin ▾; a non-allowlisted account → `/unauthorised`. This is the
   production half of the OAuth proof started locally in 14.1.

## Validation
```bash
docker build -t squash-test .
fly config validate
npm run build
# Then: merge to main → watch `fly logs` / the Actions run → manual checks 6 & 8 live.
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-14.4: deployment setup`
4. Push `at-wip`
