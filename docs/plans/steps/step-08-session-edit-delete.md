# Step 08: Session edit & delete

## Objective
Allow scorers to edit/delete their own sessions and admins to edit/delete any session.

## Context
- Step 07 delivered: session submission, recalculation trigger.
- See PRD user stories #12, #13, #16.

## Specification

### Route: `/sessions/[id]/edit`

**Page layout:**
- Same form as `/submit`, pre-populated with existing session data.
- "Save" button updates the session.
- "Delete" button (with confirmation) deletes the session.

### Server Actions:

1. `updateSession(sessionId, data)`:
   - Verify current user is the submitter OR is admin.
   - Same validation as `submitSession`.
   - Update `Session` and replace `SessionPlayer` records (delete old, insert new).
   - Trigger full recalculation.

2. `deleteSession(sessionId)`:
   - Verify current user is the submitter OR is admin.
   - Delete `Session` (cascade deletes `SessionPlayer` and `RatingsLog` entries).
   - Trigger full recalculation.

### Admin session list: `/admin/sessions`
- Table of all sessions (date, submitter, player count, total wins).
- Each row has Edit and Delete actions.
- Admin can access edit/delete for any session.

### Authorisation:
- Scorer accessing `/sessions/[id]/edit` where they are NOT the submitter → redirect to `/unauthorised`.
- Admin can edit/delete any session.

**Behaviours to verify (TDD order):**
1. Scorer can edit their own session — data updates, recalculation runs.
2. Scorer cannot edit another scorer's session (403/redirect).
3. Admin can edit any session.
4. Scorer can delete their own session — session removed, recalculation runs.
5. Scorer cannot delete another scorer's session.
6. Admin can delete any session.
7. Deleting a session cascades (SessionPlayer, RatingsLog entries removed).
8. After edit/delete, LadderSnapshot is updated.

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-08: session edit & delete`
4. Push `at-wip`
