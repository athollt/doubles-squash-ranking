# Step 13.4: Design-system foundation

## Objective
Build the shared UI primitives the winning prototype directions need — page shell,
card, badge, mobile nav chrome, and whatever else the prototype notes call for — in
the chosen CI identity, plus a "reuse before you build" convention. **No feature page
is re-skinned in this step**; this is the foundation the rollout (13.5) sits on.

## Context
- Depends on **13.3** (UX direction, `PROTOTYPE-NOTES-ux.md`) and **13.2** (CI
  identity, `PROTOTYPE-NOTES-ci.md`): scope and look are dictated by those, not
  invented here. If either direction isn't locked, this step cannot start.
- Root cause being fixed (your Q1): there was never a design-system-first step, so
  each feature page hand-rolled its own chrome and local components. The fix is to
  establish primitives *once*, here, then have 13.5 consume them.
- Current `components/ui/`: button, dialog, input, table only. Local-only components
  to promote/replace: `StatusBadge`, `MovementIndicator`, `LadderCards`
  (`app/page.tsx`).
- Tailwind v4 — theme lives in `app/globals.css` `@theme`/`:root` variables, **not**
  `tailwind.config.ts` (step 13 decision). Palette: charcoal `#1A1A1A` + electric
  blue `#2D7FF9`.
- See `CONTEXT-redesign.md` → "design-system foundation".

## Specification

The exact inventory is set by the prototype notes (`PROTOTYPE-NOTES-ux.md` for
structure, `PROTOTYPE-NOTES-ci.md` for identity). Expect at minimum:

1. **Page shell** — one component replacing the per-page `<main class="mx-auto
   max-w-… p-4 sm:p-8"> + <h1>` pattern. Single source of truth for page width,
   padding, title, and safe-area insets (PWA). Resolves the three-different-`max-w`
   inconsistency.
2. **Card** — the card-first primitive the mobile design leans on (currently inlined
   in `LadderCards`).
3. **Badge** — status/provisional/movement (the deferred "badge" follow-up; currently
   `StatusBadge` + `MovementIndicator` as local spans).
4. **Mobile nav chrome** — whatever the winning navigation model needs (e.g. bottom
   tab bar), integrated with the existing `site-header` / `admin-menu` and auth state.
5. Any additional primitives the prototype notes name (e.g. team-card for submit).
6. **Theme tokens** — replace/extend `app/globals.css` variables and `app/layout.tsx`
   fonts to the chosen CI identity (`PROTOTYPE-NOTES-ci.md`): new palette, fonts, and
   the logo/mark assets in `/public`.

Each primitive lives in `components/ui/`, is unit-tested, and is documented inline as
the canonical way to do that thing.

**Behaviours to verify (TDD order):** one test per primitive's observable behaviour
(renders title/children; badge variant → correct label/colour class; nav reflects
auth state; etc.). Order set when the step is picked up against the prototype notes.

## Validation
```bash
npm run build && npm run test
```
- New primitives unit-tested and green.
- No feature **page** re-skinned yet — rollout is 13.5. The diff is limited to
  `components/ui/`, the CI assets (`app/globals.css`, `app/layout.tsx` fonts,
  `/public` logo/icons), and tests.

## Completion
1. Update `CHANGELOG.md`.
2. Mark step complete in `PLAN.md`.
3. Commit `step-13.4: design-system foundation`.
4. Push `at-wip`.
