# Step 22: Landing, League switcher & admin provisioning

## Objective
Give the app a real root (`/`), a League switcher in the nav, and the global-Admin
flows to create a League and assign a Scorer.

## Context
- Read first: `DECISIONS.md` **ADR-011/012/013**; `CONTEXT-rungs.md` (Admin, Scorer,
  League, Slug); `PRD-rungs.md` → User Stories (Admin #1–5, Scorer #9) + Design/UX
  (component inventory).
- Depends on step 20 (grants + authz) and step 21 (routing + slug helpers).
- **Reuse before you build**: use the existing design-system primitives (steps
  13.4–13.5) for the landing list, forms, and nav chrome. Flag any missing primitive
  in CHANGELOG rather than re-rolling one.

## Specification
**Landing `/`**: signed-out → a neutral landing / sign-in entry; signed-in **Admin**
→ list of all Leagues; signed-in **Scorer** → list of their granted Leagues. Each row
links to `/l/{slug}`.

**League switcher** in the nav chrome: shows the current league context and lets a
user jump between the leagues they can act on (Admin: all; Scorer: granted).

**Create League** (Admin only): form with name + displayName; slug **suggested** from
name (step 21 helper), editable, validated unique; on create, seed that League's
settings from the default values. Server action re-checks `role === "ADMIN"`.

**Assign Scorer** (Admin only): grant a `LeagueScorer` for a league by email — creates
the `User` (allowlist) if absent, then the grant. (This is also what step 23's
access-request approval calls.)

**Behaviours to verify (TDD order):**
1. Landing data: admin sees all leagues; scorer sees only granted; signed-out sees none.
2. Create-League action: valid input creates League + seeds settings; duplicate slug
   rejected; non-admin rejected at the server action.
3. Assign-Scorer action: new email → creates User + grant; existing user → grant only;
   non-admin rejected.
4. League switcher lists exactly the leagues the actor may act on.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
Routes change → **E2E required**: admin creates a league and assigns a scorer; that
scorer signs in and sees only their league on `/`; the switcher works.

## Completion
1. Update `CHANGELOG.md`.
2. Mark step 22 complete in `RUNGS-PLAN.md`.
3. Commit `step-22: landing, League switcher & admin provisioning`.
4. Push `at-wip`.
