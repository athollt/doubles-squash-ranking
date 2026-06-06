# Architectural Decision Records

Append-only. ADRs capture *why*; code shows *what*. New entries at the bottom; supersede rather than amend.

---

## ADR-001: Full recalculation over incremental updates

**Date**: 2026-06-05
**Status**: accepted

**Context**: The rating algorithm must process all sessions chronologically to produce correct ratings (new/returning player multipliers depend on session count and gaps). At ~20 players and 1–3 sessions/week, full recalculation from scratch is computationally trivial.

**Decision**: Every session submit/edit/delete triggers a full recalculation from raw session data. No incremental update path.

**Consequence**: Simple, correct, and auditable. If scale grows 100×, revisit.

---

## ADR-002: current_ratings and ladder are computed, not stored

**Date**: 2026-06-05
**Status**: accepted

**Context**: The spec's `Current_Ratings` and `Ladder` tabs are derived views. Storing them adds a cache invalidation problem.

**Decision**: Derive current ratings and ladder order at request time from `ratings_log` + settings. No stored table for these.

**Consequence**: Every page load runs the aggregation. Acceptable at this scale (~200 ratings_log rows after a year). Add caching/materialisation later if needed.

---

## ADR-003: Reject invalid sessions at submission time

**Date**: 2026-06-05
**Status**: accepted

**Context**: The Google Sheets spec stored invalid sessions and flagged them. In a web app, rejecting bad input at the form is better UX.

**Decision**: Validate on submission. Invalid sessions are never stored. The user sees inline validation errors and corrects before submitting.

**Consequence**: No `Errors` tab equivalent needed. Simplifies the data model.

---

## ADR-004: Players are not linked to Google accounts

**Date**: 2026-06-05
**Status**: accepted

**Context**: Most players will never log in. Player identity is just a display name for the ladder. Auth is only for admins and scorers.

**Decision**: Separate `users` table (Google accounts + roles) from `players` table (name roster). No foreign key between them.

**Consequence**: A scorer who is also a player appears in both tables independently. Simple and correct for this use case.

---

## ADR-005: Out-of-repo symlinks excluded from Tailwind source detection

**Date**: 2026-06-05
**Status**: accepted

**Context**: The repo root contains `.claude` / `.devin` symlinks pointing outside the project. Tailwind v4's automatic content detection walked the root and followed them, crashing the Turbopack dev server (see CHANGELOG step 01.1). This ADR back-fills the reference made there.

**Decision**: Disable Tailwind automatic detection (`@import "tailwindcss" source(none)`) and declare explicit `@source` lines for `app`, `components`, `lib`.

**Consequence**: New top-level dirs holding class-bearing files need their own `@source` line. Documented as a maintenance note in CHANGELOG step 01.1.

---

## ADR-006: Credentials provider alongside Google for testability

**Date**: 2026-06-05
**Status**: accepted

**Context**: Step 04 specified Google OAuth as the only sign-in method, but the Google Cloud credentials do not yet exist (provisioned at deployment, step 14). This blocked all end-to-end verification of auth and the admin pages, and prevented local manual testing. Step 04's spec explicitly allowed manual/deferred E2E, but the gap left behaviour 8 (non-allowlisted account denied) unverified end-to-end.

**Decision**: Add an Auth.js Credentials provider (username/password against the `User` table, bcrypt hash in a nullable `passwordHash` column) **alongside** the Google provider. The provider lives only in the Node-runtime config (`auth.ts`), never the edge `auth.config.ts`, preserving the step-04 split. The existing allowlist/role callbacks are unchanged — they are provider-agnostic. Two seeded users (admin + test scorer) serve as E2E fixtures.

**Consequence**: The app can be signed into and fully E2E-tested without Google. Both providers coexist; once Google works (step 14), the credentials fields are hidden from the sign-in UI while the provider remains for E2E. The tradeoff is a password surface that must not be exposed in production — mitigated by hiding the UI and keeping seed passwords env-driven. Supersedes the "Google OAuth only" intent of step 04.

---

## ADR-007: Adopt the `proxy.ts` convention and collapse the split auth config

**Date**: 2026-06-05
**Status**: accepted (supersedes the split-config rationale of ADR-006 / step 04)

**Context**: Next.js 16 deprecates the root `middleware.ts` convention in favour of `proxy.ts` (the build emits a deprecation warning). The two are not identical: **`middleware.ts` runs in the Edge runtime; `proxy.ts` defaults to the Node.js runtime** (and forbids the `runtime` config option). 

Step 04 introduced a *split* auth config specifically to work around the Edge runtime: `auth.config.ts` (Prisma-free, Edge-safe, shared with the middleware) and `auth.ts` (full Node instance with the Prisma-backed callbacks + Credentials provider). The split existed *only* because the middleware ran on the Edge and could not load Prisma/bcrypt. Under `proxy.ts` running in Node, that constraint no longer exists.

The project has **no users yet** — the cheapest possible moment to correct foundational architecture.

**Decision**:
1. Rename `middleware.ts` → `proxy.ts`. The `config.matcher` export is unchanged; the Auth.js `auth(...)` wrapper remains the default export. 
2. Collapse the split: merge `auth.config.ts` back into `auth.ts` and build the single auth instance once. The proxy imports `auth` from `auth.ts`. The Edge-safety carve-outs (e.g. the duplicated `session` callback added in step 05.1) are removed — there is one config with all providers and callbacks.
3. The pure, provider-agnostic logic (`authorizeRoute`, `resolveSignIn`/`resolveJwt`/`resolveSession`/`verifyCredentials` in `lib/`) is unchanged — those are not coupled to the runtime and keep their unit tests.

**Consequence**: One auth config instead of two; no Edge/Node duplication to keep in sync (the step 05.1 bug — the Edge instance silently missing the `session` callback — becomes structurally impossible). The proxy now runs in Node, so it *may* touch Prisma directly if ever needed (it currently does not — it still only reads `role` off the signed JWT). Risk: the migration touches the core auth wiring, but the 11 Playwright E2E specs from step 05.1 cover the exact behaviour (redirects + role gating) and are the acceptance gate. If a future need arises for Edge middleware, this decision would have to be revisited (re-introducing a Prisma-free config).
