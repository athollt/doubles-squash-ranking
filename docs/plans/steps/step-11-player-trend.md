# Step 11: Public player rating trend

## Objective
Build the per-player page showing their rating over time as a chart.

## Context
- Step 07 delivered: sessions and recalculation produce RatingsLog entries per player per session.
- See PRD § Historical Views, user story #6.

## Specification

### Route: `/players/[id]`

**Page layout:**
- Player name (heading).
- Current rating and status.
- Sessions played (total and last 90 days).
- Rating trend chart: X-axis = session dates, Y-axis = rating after each session.
- Table below chart: session date, rating before, rating change, rating after (scrollable on mobile).

### Chart:
- Use a lightweight chart library compatible with Server Components or rendered client-side.
- Recommendation: recharts (popular, React-native) or chart.js via react-chartjs-2.
- Keep it simple — line chart with dots at each data point.
- Mobile-friendly (responsive width).

### Data flow:
- Query `RatingsLog` for the player, ordered by session timestamp.
- No auth required.

### Navigation:
- Clicking a player name on the ladder (step 09) links to `/players/[id]`.
- Back link to the ladder.

**Behaviours to verify (TDD order):**
1. `/players/[id]` loads without authentication (200).
2. Page shows player name, current rating, sessions played.
3. Chart renders with correct data points from RatingsLog.
4. Non-existent player ID returns 404.
5. Player with zero sessions shows an appropriate empty state.
6. Removed player page still accessible (historical data visible).

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-11: public player rating trend`
4. Push `at-wip`
