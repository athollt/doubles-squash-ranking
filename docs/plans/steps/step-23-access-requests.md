# Step 23: Non-staff bounce + access requests + approval queue

## Objective
Turn the dead-end for non-staff sign-ins into a self-service intake: a request to
become a Scorer that an Admin approves in-app — with no email infrastructure.

## Context
- Read first: `DECISIONS.md` **ADR-014** (in-app access requests, no email; extends
  ADR-009's no-outbound-messaging stance), **ADR-012** (staff-only login);
  `CONTEXT-rungs.md` (Access request); `PRD-rungs.md` → User Stories #17, #18, #6, #7.
- Depends on step 22 (the assign-Scorer action — approval reuses it).

## Specification
**Bounce page**: a signed-in user who is neither Admin nor a Scorer of any league
lands on a "this sign-in is for scorers and admins" page (story #17). It offers a
**Request scorer access** action where the user picks a League (public ladders are
browseable, so they know their club) and submits.

**`AccessRequest`** model: `id`, `email`, `name`, `leagueId`, `status`
(`pending`/`approved`/`dismissed`), `createdAt`. The request action writes a `pending`
row. **No email is sent.**

**Approval queue** (Admin only): a page listing pending requests; **Approve** calls the
step-22 assign-Scorer logic (create User if absent + `LeagueScorer` grant) and marks the
request `approved`; **Dismiss** marks it `dismissed`. Server actions re-check admin.

**Behaviours to verify (TDD order):**
1. Bounce routing: a signed-in user with no role and no grants is routed to the bounce
   page (not to a league or admin surface).
2. Request action: writes a `pending` AccessRequest for the chosen league; rejects an
   unknown league; no duplicate pending request for the same email+league.
3. Approve: creates the grant (and User if needed), sets status `approved`; the user
   can then act on that league. Non-admin rejected.
4. Dismiss: sets status `dismissed`; no grant created.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
Routes change → **E2E required**: non-staff signs in → bounce → requests access →
admin approves → user gains access to that league. Ephemeral test users (step 05.1).

## Completion
1. Update `CHANGELOG.md`.
2. Mark step 23 complete in `RUNGS-PLAN.md`.
3. Commit `step-23: non-staff bounce + access requests + approval queue`.
4. Push `at-wip`.
