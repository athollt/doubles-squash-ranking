# Step 06: Settings management (admin)

## Objective
Build the admin settings page — view and edit algorithm parameters, trigger manual recalculation.

## Context
- Step 04 delivered: auth, admin route protection.
- Step 02 delivered: Setting model, seeded with defaults from SPEC §4.2.
- Step 03 delivered: rating engine (pure function).

## Specification

### Route: `/admin/settings`

**Page layout:**
- Table/form showing all settings: key, value, description.
- Each value is editable inline.
- "Save & Recalculate" button: saves changed values then triggers a full recalculation.
- Display last recalculation timestamp (optional — nice to have).

### Server Actions:
1. `updateSettings(settings: Array<{key: string, value: number}>)` — bulk update settings.
2. `triggerRecalculation()` — runs the rating engine on all sessions, writes results to `RatingsLog`, stores a new `LadderSnapshot`.

### Recalculation flow:
1. Load all settings from DB.
2. Load all sessions with their session_players, ordered by timestamp.
3. Load all players.
4. Run the rating engine (step 03).
5. Delete all existing `RatingsLog` rows.
6. Insert new `RatingsLog` rows.
7. Create a new `LadderSnapshot` with current rankings.

### Validation:
- All setting values must be positive numbers.
- K-factor, multipliers, thresholds — no specific bounds beyond > 0.

**Behaviours to verify (TDD order):**
1. Admin can view all settings with their current values.
2. Admin can update a setting value.
3. Invalid setting value (negative, non-numeric) is rejected.
4. "Save & Recalculate" updates settings AND triggers recalculation.
5. After recalculation, RatingsLog contains entries for all valid sessions.
6. After recalculation, a new LadderSnapshot is created.

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-06: settings management (admin)`
4. Push `at-wip`
