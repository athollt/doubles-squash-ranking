# Doubles Squash @ BSC

A mobile-first web app for the BSC doubles squash ladder. Publicly displays player rankings and session history. Admins and scorers log in with Google to submit and manage sessions.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

---

## Running locally

### Prerequisites

- Node.js 20+
- Docker (for local Postgres)

### Setup

```bash
cp .env.example .env        # fill in NEXTAUTH_SECRET and Google OAuth credentials
npm install
docker compose up -d postgres
npx prisma db push          # apply schema to local DB (no tables yet in step 01)
npm run dev                 # http://localhost:3000
```

---

## Tests

```bash
# Unit / integration tests (Vitest)
npm run test

# Watch mode
npm run test:watch

# E2E tests (Playwright) — requires dev server running
npm run test:e2e
```

---

## Build

```bash
npm run build
npm run start
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Auth | Auth.js v5 (NextAuth) + Google OAuth |
| Unit tests | Vitest + Testing Library |
| E2E tests | Playwright |
