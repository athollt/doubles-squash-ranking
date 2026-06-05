# Step 09: Public ladder page

## Objective
Build the public-facing ladder page — the primary output of the system.

## Context
- Step 07 delivered: sessions can be submitted, recalculation produces RatingsLog and LadderSnapshot.
- Step 03 delivered: rating engine with ladder building logic.
- See PRD § Ladder Display, user stories #1–4.

## Specification

### Route: `/` (home page)

**Page layout:**
- Header: "BSC Doubles Squash Ladder" (or app logo from step 13).
- Ladder table:
  - Rank (1, 2, 3...)
  - Player name
  - Status badge: Active (default, no badge), Inactive (grey badge), Provisional `(P)` badge
  - Movement indicator: ↑N (green), ↓N (red), — (grey), "NEW" for first appearance
- Active players section (sorted by LadderScore desc).
- Inactive players section below (sorted by LastPlayedDate desc), with a subtle visual separator.
- "Last updated: [date of most recent session]" footer text.
- No rating points visible to the public.

### Data flow:
1. Load all sessions + session_players from DB.
2. Load settings.
3. Load players (exclude removed).
4. Run rating engine → get `currentRatings` and `ladder`.
5. Load most recent `LadderSnapshot` → derive movement indicators.
6. Render.

### Performance note:
At ~20 players and ~100 sessions (after a year), this is a trivial computation. No caching needed for v1. Server Component renders on each request.

### Mobile-first:
- Card-style layout on mobile (rank + name + movement on one line).
- Table layout on wider screens.

**Behaviours to verify (TDD order):**
1. Page loads without authentication (200 status).
2. Active players are listed before inactive players.
3. Players are sorted by LadderScore within the active group.
4. Inactive players are sorted by LastPlayedDate descending.
5. Removed players do not appear.
6. Provisional players show `(P)` marker.
7. Movement indicators display correctly (compared to previous snapshot).
8. Page renders correctly with zero sessions (empty state).

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-09: public ladder page`
4. Push `at-wip`
