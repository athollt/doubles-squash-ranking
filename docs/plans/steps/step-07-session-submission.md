# Step 07: Session submission (scorer)

## Objective
Build the session submission form — select players, enter wins, validate, submit, trigger recalculation.

## Context
- Step 03 delivered: rating engine.
- Step 05 delivered: player management (player list exists).
- Step 06 delivered: settings management, recalculation trigger.
- See PRD user stories #8–11, #14.
- See PRD § Validation Rules.

## Specification

### Route: `/submit`

**Page layout:**
- Form with 4–8 player slots.
- First 4 slots are required; slots 5–8 are optional (expandable).
- Each slot: player dropdown (searchable) + wins input (number, min 0).
- "Add New Player" option in the dropdown — opens inline name input, creates player on-the-fly.
- Optional notes text field.
- Submit button.
- Clear validation error messages displayed inline.

### Server Action: `submitSession(data)`

1. Validate:
   - 4–8 players selected.
   - No duplicate players.
   - All wins are integers ≥ 0.
   - Total player-wins is even.
   - Total player-wins > 0.
   - All players exist (or were just created on-the-fly).
2. If any new players were created on-the-fly, create them first.
3. Create `Session` record with computed `totalPlayerWins`, `inferredGames`, `playerCount`.
4. Create `SessionPlayer` records.
5. Trigger full recalculation.
6. Redirect to the ladder page (or show success message).

### On-the-fly player creation:
- Scorer types a new name in the player dropdown.
- If name doesn't match any existing player, show "Create [name]" option.
- Creates player with status ACTIVE, `createdById` = current user.
- Immediately available in the current session's player list.

### UX considerations:
- Mobile-first — form must be usable on a phone screen.
- After submission, the user should see the updated ladder.
- Use shadcn/ui Select (combobox), Input, Button, Form components.

**Behaviours to verify (TDD order):**
1. Valid session with 4 players submits successfully.
2. Valid session with 5–8 players submits successfully.
3. Session with < 4 players is rejected with error.
4. Session with duplicate players is rejected with error.
5. Session with negative wins is rejected with error.
6. Session with odd total wins is rejected with error.
7. Session with zero total wins is rejected with error.
8. On-the-fly player creation works — new player appears in session and player list.
9. After successful submission, RatingsLog is updated (recalculation ran).
10. After successful submission, a new LadderSnapshot is created.
11. Scorer can submit; unauthenticated user cannot.

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-07: session submission (scorer)`
4. Push `at-wip`
