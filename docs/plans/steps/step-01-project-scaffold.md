# Step 01: Project scaffold & dev environment

## Objective
Set up the Next.js 15 project with TypeScript, Tailwind CSS, Prisma, Vitest, Playwright, and Docker Compose for local development.

## Context
- First step — no prior CHANGELOG entries.
- Establishes the dev environment and validation command all future steps rely on.
- See RESEARCH-tech-stack.md for stack choices.

## Specification

Create the Next.js 15 App Router project with:

1. **Next.js 15** initialised with TypeScript (strict), App Router, `src/` directory disabled (use `/app`).
2. **Tailwind CSS** configured with a base colour palette (dark theme friendly — specifics in step 13).
3. **Prisma** initialised with PostgreSQL provider. Empty schema (tables come in step 02).
4. **Docker Compose** for local dev: `postgres:16-alpine` container on port 5433 (avoid conflict with any local PG).
5. **Vitest** configured for unit/integration tests.
6. **Playwright** configured for E2E tests (can be empty suite for now).
7. **ESLint** + Next.js recommended config.
8. **`.env.example`** with all required env vars (no real secrets).
9. **`README.md`** updated with: project purpose, how to run locally, how to run tests.
10. **`.gitignore`** covering node_modules, .next, .env, postgres data volume.
11. **`next.config.ts`** with `output: 'standalone'` (required for Docker production build).
12. **shadcn/ui** initialised (base config, no components yet — added as needed in later steps).

**Behaviours to verify (TDD order):**
1. `npm run build` succeeds with zero errors.
2. `npm run test` passes (even if no tests yet — Vitest exits cleanly).
3. `docker compose up -d postgres` starts Postgres and it's reachable on port 5433.
4. `npx prisma db push` connects to the Docker Postgres successfully.
5. Dev server starts (`npm run dev`) and renders a placeholder page at `/`.

## Validation
```bash
npm run build && npm run test
docker compose up -d postgres
npx prisma db push
docker compose down
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-01: project scaffold & dev environment`
4. Push `at-wip`
