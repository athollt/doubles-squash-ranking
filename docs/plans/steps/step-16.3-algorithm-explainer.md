# Step 16.3: Rating-algorithm explainer

## Objective
Add an overview section to the Admin → Rating Algorithm (settings) screen that
explains, in plain language, how the rating algorithm works.

## Context
- Read first: `DECISIONS.md` ADR-001 (full recalculation), ADR-002 (ratings/ladder
  are computed not stored), ADR-003 (invalid sessions rejected). These are the
  *why* the explainer should reflect.
- Relevant files: `app/admin/settings/page.tsx` (the rating-algorithm /
  settings screen) and the rating engine in `lib/` (the source of truth —
  validate the explanation against the actual code from step 03, per AGENTS.md §2:
  documentation must be validated from source, never general knowledge).
- The settings screen already exposes the tunable parameters; this step adds a
  read-only explanatory section alongside them.

## Specification

**Behaviours to verify (TDD order):**
1. **Explainer section renders on the settings screen.** Admin → Rating Algorithm
   shows a clearly delineated overview section (heading + prose) describing how
   ratings are produced.
2. **Content is accurate to the engine.** The explanation covers, in plain
   English and matching the actual engine behaviour: that every session triggers a
   full recalculation from raw results (ADR-001); how a player's rating changes
   based on session outcomes; how new/returning-player handling works (the
   multipliers the engine actually applies); and how the live ladder is derived
   from the rating log (ADR-002). Each claim traces to engine code, not to general
   ELO knowledge.
3. **References the live settings.** Where the explanation mentions a tunable
   value, it refers to the setting shown on the same screen (so the prose stays
   true if an admin changes it) rather than hard-coding the number in copy.

## Constraints
- **Surgical:** no change to the rating engine, settings model, or any mutation —
  this adds presentational explanatory content only.
- Validate every statement against the step 03 engine source before writing it.
  If the engine's behaviour is more nuanced than a one-liner, say so plainly
  rather than oversimplifying.

**E2E:** the settings route is admin-only and already covered; extend the existing
admin-settings spec to assert the explainer section is present rather than adding a
new journey.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
- Admin → Rating Algorithm shows the explainer; a non-admin cannot reach it
  (existing gating unchanged).
- Each explanatory claim is verifiable against the rating-engine source.

## Completion
1. Update `CHANGELOG.md`.
2. Mark step complete in `PLAN.md`.
3. Commit `step-16.3: rating-algorithm explainer`.
4. Push `at-wip`.
