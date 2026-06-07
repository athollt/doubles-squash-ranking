# Step 16.2: Submit-flow rework (pick players, then enter scores)

## Objective
Refine the session-submit flow so the scorer picks all players first and then
enters scores — the highest-value SCORER journey — building on the courtside
form already shipped in 13.5.

## Context
- Read first: `CHANGELOG.md` step 13.5 and `components/session-form.tsx`. The
  13.5 redesign already moved the form to a tap-to-pick chip model with a
  segmented wins selector. The feedback ("choose names of all players, then enter
  the scores for each") asks for an explicit **two-phase** flow: a player-picking
  phase, then a score-entry phase — rather than per-slot pick-and-score
  interleaved.
- `components/session-form.tsx` is reused by both `/submit` and
  `app/sessions/[id]/edit/page.tsx` — its public contract (`Props`, `FormSlot`
  payload, `onSubmit`/`onDelete`) must stay stable so the edit page keeps working.
- DECISIONS: the rating engine infers pairings from the flat slot list — there are
  no teams in the payload (see the 13.5 form comment). Keep that contract.

## Specification

**Behaviours to verify (TDD order):**
1. **Phase 1 — pick players.** The form first presents player selection for all
   slots (the existing chip picker + "+ New"), with no score entry visible yet.
   The scorer selects every participating player (and adds new ones inline).
2. **Advance to scoring.** Once players are chosen, a clear action moves to the
   scoring phase. The chosen players are listed; the picker chrome collapses.
3. **Phase 2 — enter scores.** Each chosen player shows the segmented wins
   selector. The scorer enters wins per player. A way back to adjust the roster
   remains available.
4. **Same payload.** Submitting produces the identical `FormSlot[]` payload the
   current form emits (`playerId` or `newName`, `wins`) — no change to `onSubmit`
   or the server action.
5. **Edit mode unchanged in contract.** The edit page, which passes
   `initialSlots`, still mounts and submits correctly; pre-populated sessions may
   land directly in the scoring phase (players already chosen).

## Constraints
- **Surgical:** the submit/edit server actions, validation, and rating
  recalculation are untouched — this is an interaction restructure of the client
  form only.
- Reuse the existing chip picker and wins-selector UI; this step reorganises them
  into two phases, it does not restyle them.

**E2E (PLAN.md rule):** the session-submit journey must stay green and is updated
to the two-phase flow (pick players → continue → enter scores → submit). The edit
journey must also stay green.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
- A scorer can submit a session via pick-all-then-score and the resulting session
  matches the prior payload exactly.
- Editing an existing session still works (roster pre-populated, scores editable).
- Manual phone check: the two-phase flow is faster/clearer courtside than the
  interleaved version.

## Completion
1. Update `CHANGELOG.md`.
2. Mark step complete in `PLAN.md`.
3. Commit `step-16.2: submit-flow rework`.
4. Push `at-wip`.
