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

