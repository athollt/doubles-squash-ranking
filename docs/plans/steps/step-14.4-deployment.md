# Step 14.4: Deployment setup

## Objective
Create the production Docker Compose setup, Caddyfile, production Dockerfile, GitHub
Actions workflow, and deployment documentation — then perform the **first production
deploy** and verify real Google sign-in on the live domain.

## Depends on
- **14.1** Google OAuth credentials exist (redirect URI for `squash.tomlinson.co.za`
  registered).
- **14.2** Hetzner VPS, DNS, deploy user/key, `.env`, backup bucket provisioned.
- **14.3** GitHub repo secrets populated, GHCR write enabled.
- **13.3** Look & feel complete (deploy the final UI, not the baseline).

## Context
- All feature steps delivered.
- See RESEARCH-tech-stack.md §7 (hosting), §8 (CI/CD) for full details.
- Domain: `squash.tomlinson.co.za`. Hosting: Hetzner Cloud CX22, Cape Town.
- `.env` uses Auth.js v5 names (`AUTH_URL`/`AUTH_SECRET`), not `NEXTAUTH_*`.

## Specification

### Production Docker Compose (`docker-compose.prod.yml`):
- `postgres` service (postgres:16-alpine, named volume).
- `nextjs` service (built from Dockerfile, standalone output).
- `caddy` service (caddy:2-alpine, auto-SSL).
- Environment variables from `.env` on the VPS.

### Caddyfile:
```
squash.tomlinson.co.za {
  reverse_proxy nextjs:3000
}
```

### Production Dockerfile:
- Multi-stage build (builder + runner).
- `output: 'standalone'` in next.config.ts (already set in step 01).
- Runs `prisma generate` at build time.
- Final image: node:20-alpine, runs `node server.js`.

### GitHub Actions workflow (`.github/workflows/deploy.yml`):
- Trigger: push to `main`.
- Build Docker image → push to GHCR.
- SSH to VPS → pull image → `docker compose up -d --no-deps nextjs`.
- Run `prisma migrate deploy` in the container.

### Documentation:
- `docs/DEPLOYMENT.md` — step-by-step VPS *runtime* guide (first `docker compose up`,
  TLS provisioning, `prisma migrate deploy` + `prisma db seed`, backup cron
  `pg_dump` → Hetzner Object Storage). The *prerequisite* account setup lives in
  `docs/deployment/01..03` (steps 14.1–14.3) — `DEPLOYMENT.md` references them rather
  than duplicating.

### GitHub Secrets (provisioned in 14.3, consumed here):
- `VPS_HOST`, `VPS_SSH_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`,
  `DATABASE_URL`, `DB_PASSWORD`.

### `.env.example` update:
- Ensure all production env vars are documented with placeholder values and comments
  (already largely present; reconcile against the prod compose).

**Behaviours to verify (TDD order):**
1. `docker build .` succeeds (production Dockerfile).
2. `docker compose -f docker-compose.prod.yml config` validates without errors.
3. GitHub Actions workflow YAML is valid (lint with `actionlint` if available).
4. `.env.example` documents all required variables.

**Production verification (completion proof — first live deploy):**
5. Push to `main` → workflow builds, pushes to GHCR, SSHes in, deploys, migrates.
6. `https://squash.tomlinson.co.za` serves over a valid Caddy-provisioned TLS cert.
7. **Real Google sign-in on the live domain**: sign in as `atholl@tomlinson.co.za` →
   land signed-in with Admin ▾; a non-allowlisted account → `/unauthorised`. This is
   the production half of the OAuth proof started locally in 14.1.

## Validation
```bash
docker build -t squash-test .
docker compose -f docker-compose.prod.yml config
npm run build
# Then: merge to main → observe the deploy → manual checks 6 & 7 on the live domain.
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-14.4: deployment setup`
4. Push `at-wip`
