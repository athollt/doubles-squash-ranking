# Step 13.5: Redesign rollout (re-implement screens)

## Objective
Re-implement every route on the 13.4 design-system primitives in the winning
prototype direction. This is where **consistency** (your Q1) and the **mobile-app
feel** (your Q2) actually land — every screen now shares the same shell, components,
and navigation model.

## Context
- Depends on **13.4** (primitives exist) and the prototype directions
  (`PROTOTYPE-NOTES-ux.md` structure, `PROTOTYPE-NOTES-ci.md` identity).
- This is the "throw the prototype away, rebuild properly with tests" stage the
  `/prototype` skill mandates — prototype code is already gone (deleted in 13.3); the
  winning *approach* is re-implemented here against the real mutations.
- 14.4 (Deployment) depends on this step — deploy reflects the final design.

## Specification

Re-implement on the new primitives, per the prototype notes:

1. **Ladder** (`/`) — adopt the winning layout/nav; replace local `StatusBadge`,
   `MovementIndicator`, `LadderCards` with the shared primitives; drop the
   hand-rolled `sm:hidden / hidden sm:block` fork in favour of the design-system
   responsive approach.
2. **Submit a Session** (`/submit` + `components/session-form.tsx`) — adopt the
   winning courtside interaction model (real mutation wired, not stubbed). This is
   the highest-value screen for the SCORER role.
3. **All other routes** onto the shared page shell + primitives: `players/[id]`,
   `sessions`, `sessions/[id]`, `sessions/[id]/edit`, `signin`, `submit`,
   `unauthorised`, `~offline`, and every `admin/*` page. No page keeps its own
   bespoke `<main>`/`<h1>`/`max-w`.
4. Carry over the still-open polish follow-ups as the new components make natural:
   searchable player combobox (deferred from 05/07), delete-confirmation modal
   (deferred from 08) — only if the prototype notes / the design call for them.

**E2E (PLAN.md rule):** every touched user-facing route keeps its journey covered.
Update existing Playwright specs to the new structure/selectors rather than deleting
coverage; the ladder-view and session-submit journeys must stay green.

**Surgical:** behaviour is unchanged — this is a presentation/interaction re-platform.
The rating engine, auth, and data model are untouched. No new scope.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
- Every route renders on the shared shell; no per-page bespoke chrome remains
  (grep for `mx-auto w-full max-w-` in `app/**/page.tsx` returns only the shell).
- All unit + E2E green; teardown leaves zero `[e2e]` leftovers.
- Manual phone check: installed PWA feels like an app (winning nav model present),
  ladder + submit journeys work on a phone viewport.

## Completion
1. Update `CHANGELOG.md` (note which follow-ups were folded in vs still deferred).
2. Mark step complete in `PLAN.md`.
3. Commit `step-13.5: redesign rollout`.
4. Push `at-wip`.
