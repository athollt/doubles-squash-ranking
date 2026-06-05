# Step 05: Player management (admin)

## Objective
Build the admin player management page — list, add, edit name, change status.

## Context
- Step 04 delivered: auth, admin route protection.
- Step 02 delivered: Player model (id, name, status, createdAt, createdById).
- See PRD user stories #15, #21.

## Specification

### Route: `/admin/players`

**Page layout:**
- Table of all players (including removed) with columns: Name, Status, Created, Actions.
- "Add Player" button opens an inline form or modal.
- Each row has Edit (name) and Status toggle (Active ↔ Removed) actions.

### Server Actions:
1. `createPlayer(name: string)` — creates a player with status ACTIVE.
2. `updatePlayerName(playerId: string, name: string)` — updates display name.
3. `updatePlayerStatus(playerId: string, status: 'ACTIVE' | 'REMOVED')` — toggles status.

### Validation:
- Name must be non-empty and trimmed.
- Name must be unique (case-insensitive).
- Cannot delete players — only set status to REMOVED.

### UI:
- Use shadcn/ui Table, Button, Input, Dialog components (install as needed).
- Mobile-friendly layout (responsive table or card list on small screens).

**Behaviours to verify (TDD order):**
1. Admin can create a player — appears in the list.
2. Creating a player with a duplicate name (case-insensitive) fails with error.
3. Creating a player with empty/whitespace name fails with error.
4. Admin can rename a player.
5. Admin can set a player's status to REMOVED.
6. Admin can reactivate a REMOVED player (set back to ACTIVE).
7. Scorer cannot access `/admin/players` (covered by step 04 middleware, but verify).

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-05: player management (admin)`
4. Push `at-wip`
