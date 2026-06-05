# Step 10: Public session history

## Objective
Build the public session history page showing past sessions.

## Context
- Step 07 delivered: sessions stored in DB with session_players.
- See PRD § Historical Views, user story #5.

## Specification

### Route: `/sessions`

**Page layout:**
- List of sessions, most recent first.
- Each session card/row shows:
  - Date (formatted nicely, e.g. "5 Jun 2026")
  - Player count
  - Total games (inferred)
  - Expandable detail: player names and games won per player
- Pagination or "load more" if list grows (simple — max ~150 sessions/year).

### Route: `/sessions/[id]`

**Page layout:**
- Full session detail:
  - Date
  - Submitted by (name, not email)
  - Players with wins (table)
  - Notes (if any)
  - Total player-wins and inferred games

### Data flow:
- Server Component queries sessions with related session_players and players.
- No auth required.

**Behaviours to verify (TDD order):**
1. `/sessions` loads without authentication (200).
2. Sessions are listed most recent first.
3. Each session shows date, player count, total games.
4. `/sessions/[id]` shows full detail for a specific session.
5. Non-existent session ID returns 404.
6. Page renders correctly with zero sessions (empty state).

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-10: public session history`
4. Push `at-wip`
