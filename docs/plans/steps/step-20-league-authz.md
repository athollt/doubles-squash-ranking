# Step 20: Staff-only auth — LeagueScorer grants + league-scoped authz

## Objective
Replace the single global role model with global-Admin + per-league Scorer grants, as
pure authorization logic, before any routing consumes it.

## Context
- Read first: `DECISIONS.md` **ADR-012** (staff-only auth, per-league grants),
  **ADR-010** (own-session ownership rule), **ADR-006/007** (allowlist, single auth
  config); `CONTEXT-rungs.md` (Staff, Admin, Scorer, LeagueScorer).
- Pure seams today: `lib/auth-rules.ts` (`authorizeRoute`, `isPublicRoute`,
  `isAdminOnly`), `lib/session-authz.ts` (`canMutateSession`). Both are pure and
  unit-tested — extend them, don't move logic into the proxy/actions.
- `User.role` stays (`ADMIN` | `SCORER`); a `SCORER`'s power now comes from grants.

## Specification
**Grant model**: add `LeagueScorer(userId, leagueId)` (unique `(userId, leagueId)`).
A Prisma-backed store port plus a pure helper `canScoreLeague({ role, grants, leagueId })`
→ `true` if `role === "ADMIN"` (bypass) or a grant exists for that league.

**Extend `authorizeRoute`** (still pure, route-shape aware — the actual `/l/{slug}`
prefixes land in step 21, but the *logic* lands here so step 21 only wires URLs):
- Admin bypasses all league gates.
- A scorer may reach a league's scorer/admin surfaces only with a grant for that
  league; otherwise `unauthorised`.
- Public league reads remain `allow` (no auth).

**Extend `canMutateSession`**: keep the own-session rule (ADR-010) and add a
league-scope guard — a scorer can mutate a session only if it belongs to a league they
are granted *and* they submitted it; admin still mutates any.

**Back-fill** the current BSC scorers as `LeagueScorer` grants on the seed League
(consume the emails recorded in step 19 if not already granted).

**Behaviours to verify (TDD order):**
1. `canScoreLeague`: admin → true for any league; scorer with grant → true; scorer
   without grant → false.
2. `authorizeRoute`: scorer without grant hitting a league scorer/admin route →
   `unauthorised`; with grant → `allow`; admin → `allow`; public league read → `allow`.
3. `canMutateSession`: scorer can mutate own session in a granted league; cannot mutate
   own session in a non-granted league; cannot mutate another scorer's session; admin
   mutates any.
4. Grant store round-trips (create/read/delete a grant).

## Validation
```bash
npm run build && npm run test
```
No routes change yet (logic only) → **no E2E required** (record in CHANGELOG). The
`/l/{slug}` wiring + its E2E land in step 21.

## Completion
1. Update `CHANGELOG.md`.
2. Mark step 20 complete in `RUNGS-PLAN.md`.
3. Commit `step-20: staff-only auth — LeagueScorer grants + league-scoped authz`.
4. Push `at-wip`.
