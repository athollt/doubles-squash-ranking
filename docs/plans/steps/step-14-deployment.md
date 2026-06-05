# Step 14: Deployment setup

## Objective
Create the production Docker Compose setup, Caddyfile, production Dockerfile, GitHub Actions workflow, and deployment documentation.

## Context
- All feature steps delivered.
- See RESEARCH-tech-stack.md §7 (hosting), §8 (CI/CD) for full details.
- Domain: `squash.tomlinson.co.za`.
- Hosting: Hetzner Cloud CX22, Cape Town.

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
- `docs/DEPLOYMENT.md` — step-by-step VPS setup guide:
  1. Provision Hetzner CX22 (Cape Town, Ubuntu 24.04, Docker CE).
  2. DNS: point `squash.tomlinson.co.za` A record to VPS IP.
  3. Create deploy user, SSH key.
  4. Clone repo, create `.env` from `.env.example`.
  5. First `docker compose up` — Caddy provisions TLS.
  6. `prisma migrate deploy` + `prisma db seed`.
  7. Set up backup cron (`pg_dump` → Hetzner Object Storage).

### GitHub Secrets to document:
- `VPS_HOST`, `VPS_SSH_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `DATABASE_URL`.

### `.env.example` update:
- Add all production env vars with placeholder values and comments.

**Behaviours to verify (TDD order):**
1. `docker build .` succeeds (production Dockerfile).
2. `docker compose -f docker-compose.prod.yml config` validates without errors.
3. GitHub Actions workflow YAML is valid (lint with `actionlint` if available).
4. `.env.example` documents all required variables.

## Validation
```bash
docker build -t squash-test .
docker compose -f docker-compose.prod.yml config
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-14: deployment setup`
4. Push `at-wip`
