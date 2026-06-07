# BSC Doubles Squash Ladder

A mobile-first PWA for the BSC doubles squash ladder. The public sees rankings, session
history, and per-player rating trends; **scorers** log results, manage players, and view the
rating settings, while **admins** also manage users and edit the settings — all via Google
sign-in.

**Live:** https://squash.tomlinson.co.za

Built with Next.js 16 (App Router), TypeScript, Prisma 7 / PostgreSQL, Auth.js v5, Tailwind
v4, and Serwist (PWA).

---

## Running locally

### Prerequisites

- Node.js 22+
- Docker (for local Postgres)

### Setup

```bash
cp .env.example .env     # fill in AUTH_SECRET (openssl rand -base64 32) + Google OAuth creds
npm install
docker compose up -d postgres        # Postgres on localhost:5433
npx prisma migrate dev               # apply migrations + seed (15 settings + admin)
npm run dev                          # http://localhost:3001
```

> **Sign-in locally:** production uses Google only, but a Credentials provider is enabled for
> local/E2E. The seed creates admin `atholl@tomlinson.co.za` with the password from
> `SEED_ADMIN_PASSWORD` (default `localdev`). Google OAuth also works locally if you set the
> client id/secret.

Optional demo data (deterministic sample roster + sessions):

```bash
npm run seed:sample
```

---

## Tests

```bash
npm run test         # unit / integration (Vitest)
npm run test:watch   # watch mode
npm run test:e2e     # E2E (Playwright) — needs local Postgres up + migrated
npm run lint         # ESLint
```

E2E creates and tears down its own ephemeral users/data; it leaves the seeded admin and any
sample data intact.

---

## Build

```bash
npm run build        # next build --webpack (emits the Serwist service worker)
npm run start
```

The production build **must** use `--webpack` (the `build` script does) — the Serwist PWA
plugin is a webpack plugin and is skipped by the default builder.

---

## Deployment

Deployed to Fly.io (Johannesburg) — push to `main` triggers a `flyctl deploy`. Full runtime
guide (release migrations, first-admin seed, logs, rollback, backups):
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). One-time account/infra setup:
[`docs/deployment/`](docs/deployment/).

---

## Documentation

- [`OVERVIEW.md`](OVERVIEW.md) — architecture, directory map, data model, conventions.
- [`docs/RATING-ALGORITHM.md`](docs/RATING-ALGORITHM.md) — how ratings, the ladder, and
  active/inactive status are computed (every setting explained).
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production runtime guide.
- [`docs/plans/`](docs/plans/) — design documents: PRD, plan, decisions (ADRs), changelog,
  and the original Google Sheets spec.
