# OVERVIEW — doubles-squash-ranking

Architecture and internals of the BSC Doubles Squash Ladder. For *running* the app
(setup, dev, tests, deploy) see [`README.md`](README.md); this doc is the map of *how it is
built*.

## Purpose

A mobile-first PWA for a club doubles-squash ladder. The public sees rankings, session
history, and per-player rating trends; signed-in **scorers** submit/edit their own sessions,
manage players, and view rating settings; **admins** also manage users and edit the rating
settings (see [ADR-010](docs/plans/DECISIONS.md)). Hosted on Fly.io (Johannesburg)
— see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Tech stack

- **Next.js 16** (App Router, TypeScript strict) — Server Components + Server Actions; no
  REST API layer for the app's own data.
- **Prisma 7** with the **`@prisma/adapter-pg`** driver adapter → **PostgreSQL**. The
  generated client lives in [`app/generated/prisma`](app/generated/prisma) (the
  `prisma-client` generator emits TypeScript).
- **Auth.js v5** (NextAuth) — Google OAuth (+ a Credentials provider for local/E2E only).
- **Tailwind CSS v4** (CSS-variable theme, no JS config) + **shadcn/ui** primitives.
- **Serwist** service worker for the PWA (emitted by the production webpack build only).
- **Vitest** (unit) + **Playwright** (E2E).

## Architecture at a glance

The codebase follows a **pure-core / thin-shell** pattern throughout:

- **Pure logic in [`lib/`](lib/)** — domain functions that take plain inputs (or a *store
  port*) and return results. No Prisma, no framework. Unit-tested in isolation.
- **Server Actions** ([`app/**/actions.ts`](app/)) — thin wrappers that authorise, call the
  pure function, persist via Prisma, and `revalidatePath`.
- **Server Components** (`page.tsx`) — load data via a Prisma store, run the pure engine, and
  render. Public pages are `force-dynamic` (no stored ladder cache — see
  [ADR-002](docs/plans/DECISIONS.md)).

This is why most behaviour is testable without a database or the OAuth runtime.

## Directory map

| Path | What's there |
|---|---|
| [`app/`](app/) | Routes (App Router). Public: `/` (ladder), `/sessions`, `/sessions/[id]`, `/players/[id]`. Auth'd: `/submit`, `/sessions/[id]/edit`. Admin: `/admin/{players,sessions,settings,users}`. Plus `/signin`, `/unauthorised`, `/~offline`. Server Actions in `**/actions.ts`. |
| [`app/sw.ts`](app/sw.ts) | Serwist service-worker source (bundled to `public/sw.js` at build). |
| [`lib/`](lib/) | Pure domain logic (see below) + the Prisma singleton and store adapters. |
| [`components/`](components/) | App components (`site-header`, `session-form`, `admin-menu`, `rating-trend-chart`, …) and `components/ui/` design-system primitives (`page-shell`, `card`, `badge`, `trend`, `bottom-nav`, …). |
| [`prisma/`](prisma/) | `schema.prisma`, `migrations/`, `seed.ts` (15 settings + first admin), `seed-sample.ts` (opt-in demo data). |
| [`auth.ts`](auth.ts) | Single Auth.js config (providers + `signIn`/`jwt`/`session` callbacks). |
| [`proxy.ts`](proxy.ts) | Next 16 proxy (was `middleware.ts`) — route gating via `authorizeRoute`. |
| [`docs/`](docs/) | This repo's docs: deployment, rating algorithm, and the `plans/` design set. |

## Key domain modules (`lib/`)

- **Rating** — [`rating-engine.ts`](lib/rating-engine.ts) (the pure `recalculate`),
  orchestrated by [`recalc.ts`](lib/recalc.ts) over a store port, backed by
  [`recalc-store.ts`](lib/recalc-store.ts). Full explanation:
  [`docs/RATING-ALGORITHM.md`](docs/RATING-ALGORITHM.md).
- **Auth** — [`auth-rules.ts`](lib/auth-rules.ts) (`authorizeRoute` — pure route policy) and
  [`auth-callbacks.ts`](lib/auth-callbacks.ts) (sign-in allowlist, role attach, credentials
  verify). [`password.ts`](lib/password.ts) for the Credentials provider.
- **Entities** — `players.ts` / `users.ts` / `settings.ts` (pure create/update + validation
  over `*-store.ts` ports), `session-validation.ts`, `session-authz.ts`.
- **Presentation helpers** — `public-ladder.ts`, `session-history.ts`, `player-trend.ts`,
  `nav.ts`.
- **Demo data** — `sample-data.ts` (deterministic generator used by `seed-sample.ts`).

## Data model (`prisma/schema.prisma`)

`User` (Google accounts + role) and `Player` (name roster) are **deliberately unlinked**
([ADR-004](docs/plans/DECISIONS.md)). A `Session` has many `SessionPlayer` rows (wins per
player). `RatingsLog` stores every per-player-per-session rating step (powers trends);
`LadderSnapshot` stores a ladder state as JSON (powers movement indicators). `Setting` holds
the 15 tunable algorithm parameters. `SessionPlayer` + `RatingsLog` cascade-delete with their
`Session`.

## Authentication & authorisation

- Sign-in is **Google OAuth**; the `signIn` callback enforces an **allowlist** — only emails
  present in the `User` table may sign in (others → `/unauthorised`). Role (`ADMIN` /
  `SCORER`) is attached to the JWT.
- [`proxy.ts`](proxy.ts) gates every request via the pure
  [`authorizeRoute`](lib/auth-rules.ts): public routes open; `/submit` and most `/admin/*`
  (Players, Sessions, Settings) require sign-in; only `/admin/users` requires `ADMIN`
  ([ADR-010](docs/plans/DECISIONS.md)). Server Actions **re-check** the role — settings-edit
  and user management stay ADMIN-only, and a scorer may edit only their own sessions
  (defence in depth).
- A **Credentials provider** exists for local manual testing and E2E only
  ([ADR-006](docs/plans/DECISIONS.md)); production uses Google.
- Single Auth.js config in `auth.ts` (the earlier Edge/Node split was collapsed —
  [ADR-007](docs/plans/DECISIONS.md)).

## Conventions

- **Reuse before building.** Shared UI lives in `components/ui/` (page shell, card, badge,
  trend, bottom-nav); pages compose these rather than hand-rolling chrome
  ([ADR-008, redesign sequencing](docs/plans/DECISIONS.md)).
- **Pure first.** New domain logic goes in `lib/` as a pure function over a store port, with
  a unit test, before any Server Action/Component wires it up.
- **Tailwind v4 source globs** are explicit (`@source` in `globals.css`) because automatic
  detection follows out-of-repo symlinks and breaks the dev server
  ([ADR-005](docs/plans/DECISIONS.md)). New top-level class-bearing dirs need a `@source`
  line.
- **E2E for any route change** — steps that add/alter a user-facing route extend the
  Playwright suite using the ephemeral test-user/test-data pattern (created in global setup,
  removed in teardown).

## Domain language

- **Session** — one night's play; a set of players with games won each (partners/opponents
  not recorded).
- **Rating** — a player's skill number (starts at 1000). **Ladder score** = rating + activity
  bonus; the ladder ranks by ladder score.
- **Provisional** — a player still within their first `NewPlayerSessions` sessions.
- **Active / Inactive** — played within / outside `ActiveThresholdDays`. **Removed** —
  off the visible ladder but kept in history.
- **Scorer / Admin** — the two roles. See [`docs/RATING-ALGORITHM.md`](docs/RATING-ALGORITHM.md)
  for every algorithm term.

## Where to read more

- Rating maths: [`docs/RATING-ALGORITHM.md`](docs/RATING-ALGORITHM.md)
- Production/runtime: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- Decisions & history: [`docs/plans/DECISIONS.md`](docs/plans/DECISIONS.md),
  [`docs/plans/CHANGELOG.md`](docs/plans/CHANGELOG.md)
- Original requirements: [`docs/plans/PRD-doubles-squash-ladder.md`](docs/plans/PRD-doubles-squash-ladder.md),
  [`docs/plans/SPEC-original-google-sheets.md`](docs/plans/SPEC-original-google-sheets.md)
