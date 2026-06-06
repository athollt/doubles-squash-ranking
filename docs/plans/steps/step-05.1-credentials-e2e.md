# Step 05.1: Credentials provider & retroactive E2E (steps 1–5)

## Objective
Add a username/password (Credentials) auth provider alongside Google so the app
can be signed into without Google Cloud credentials, then build the Playwright
E2E suite that should have accompanied steps 1–5 — exercising the real
sign-in/role flow and the public pages.

## Why this step exists
Steps 01–05 shipped with Vitest unit coverage only. The auth flow (step 04) was
never verified end-to-end because Google OAuth needs Console credentials that do
not yet exist, and no E2E tests were written for the pages delivered so far.
A Credentials provider unblocks both **manual testing** and **E2E** immediately,
without waiting for step 14 (deployment / Google setup).

## Context
- Read `DECISIONS.md` ADR-006 (credentials provider alongside Google) and ADR-004
  (players not linked to users).
- Step 02 delivered the `User` model (email, role) and the seed
  (`atholl@tomlinson.co.za`, ADMIN). This step adds a password to it.
- Step 04 delivered: `authorizeRoute`, `resolveSignIn`/`resolveJwt`/`resolveSession`
  (all provider-agnostic — keyed on email + role), the split config
  (`auth.config.ts` / `auth.ts`), middleware, and `/unauthorised`.
- Step 05 delivered: `/admin/players` (admin-only).

## Known defects to fix in this step
1. **Playwright targets the wrong port.** `playwright.config.ts` uses
   `baseURL: http://localhost:3000` and `webServer.url: http://localhost:3000`,
   but the dev server runs on **3001** (step 01.1). E2E cannot connect today.
   Fix both to 3001 (or read from an env var defaulting to 3001).
2. **No password hashing dependency.** `bcryptjs` is not installed.

## Specification

### Part A — Credentials provider (the enabler)

1. **Schema**: add a nullable `passwordHash String?` column to `User`. Create a
   Prisma migration. (Nullable so Google-only users — the future norm — need no
   password.)
2. **Hashing**: add `bcryptjs` (+ `@types/bcryptjs`). A `verifyPassword(plain,
   hash)` helper and a `hashPassword(plain)` helper in `lib/password.ts`.
3. **Seed (manual testing only)**: give the existing real admin
   `atholl@tomlinson.co.za` a dev password from an env var (`SEED_ADMIN_PASSWORD`,
   documented local-only default). This is a real account, used for manual
   sign-in — NOT an E2E fixture. Do **not** seed any test users; E2E creates and
   deletes its own (see Part B).
4. **Provider**: add a Credentials provider to the **Node-runtime** config
   (`auth.ts`), NOT to the edge `auth.config.ts` (it must not pull Prisma/bcrypt
   into the edge bundle — keep the step-04 split intact). Its `authorize` looks
   up the user by email, verifies the password hash, and returns `{ email }` (or
   null). The existing `signIn`/`jwt`/`session` callbacks then apply the
   allowlist + role exactly as today — no change to them.
5. **Both providers coexist.** Google stays wired. A documented follow-up (step
   14) will hide the credentials fields from the sign-in screen once Google
   works; the provider itself can remain for E2E.
6. **Sign-in page**: build a minimal custom `/signin` page with an
   email + password form that calls the credentials provider (plus a "Sign in
   with Google" button for the future path). No password reset, registration, or
   any other auth workflow — out of scope, by decision. Configure Auth.js
   `pages.signIn = "/signin"` so middleware redirects land here. This is the page
   used for both manual testing and E2E login.

### Part B — E2E suite for steps 1–5

Fix the port defects first (so any E2E can connect). Then add specs under `e2e/`:

**Public / scaffold (steps 01, 03 surface):**
1. `/` returns 200 and shows "Doubles Squash @ BSC".
2. `/unauthorised` returns 200 and shows the no-access message.

**Auth + routing (step 04):**
3. Unauthenticated visit to `/admin/players` redirects to sign-in.
4. Unauthenticated visit to `/submit` redirects to sign-in (route is protected
   even though the page 404s after auth — assert the redirect, not the page).
5. Signing in with an email that is **not in the users table** (never created) is
   denied → `/unauthorised`. (Behaviour 8 from step 04, finally verified end-to-end.)
6. Signing in as **TestScorer** then visiting `/admin/players` → redirected
   to `/unauthorised`.

**Player management (step 05):**
7. Signing in as **TestAdmin** → `/admin/players` loads and lists players.
8. Admin adds a player via the dialog → it appears in the table.
9. Admin renames a player → the new name appears.
10. Admin removes a player (status toggle) → status shows REMOVED; reactivate
    returns it to ACTIVE.
11. Adding a duplicate name (case-insensitive) shows an inline error and adds no
    row.

### Test data / isolation
- E2E runs against the local Postgres (docker compose) with migrations applied.
  Document the setup commands in the spec/README.
- **Ephemeral test users.** A Playwright **global setup** creates `TestAdmin`
  (`testadmin@bsc.local`, ADMIN) and `TestScorer` (`testscorer@bsc.local`,
  SCORER) with known passwords; a **global teardown** deletes exactly those two
  users after the suite. They never appear in the seed, so the real data stays
  clean. (A non-allowlisted login — spec #5 — uses an email that is deliberately
  never created.)
- **Ephemeral test players.** Player-mutation specs (8–11) create uniquely-named
  players (e.g. suffixed with a per-run token) and remove them in teardown (set
  REMOVED is fine — ADR-004 keeps history; or hard-delete the specific rows the
  test created). The goal: a clean rerun with no accumulated noise.

### TDD note for E2E
Playwright specs are the test layer here; there is no "implementation" to write
for Part B beyond the provider/seed/fixtures in Part A and the port fix. Apply
the spirit of vertical TDD: get spec #1 (public page) green first to prove the
harness + port fix work end-to-end, then add specs one at a time. Do not bulk-author
all specs before any pass.

**Behaviours to verify (TDD order):** Part A items 1–6 (unit-test
`verifyPassword`/`hashPassword`; the provider `authorize` is exercised by the E2E
in Part B), then Part B specs 1→11 in order.

## Validation
```bash
npm run test          # existing Vitest unit suite still green (+ password helpers)
npm run build         # clean, no Edge Runtime warnings (split config intact)
npm run test:e2e      # Playwright suite green against local DB
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step 05.1 complete in `PLAN.md`
3. Commit `step-05.1: credentials provider & E2E for steps 1-5`
4. Push `at-wip`
