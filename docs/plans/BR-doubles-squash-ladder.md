# Business Requirements: BSC Doubles Squash Ladder

## 1. Problem Statement

BSC runs social doubles squash sessions where players rotate partners and opponents. There is no formal challenge-match structure. The club wants a visible, fair ranking of individual players based on their performance across these social sessions.

The ranking must:

- Rank individuals, not fixed pairs.
- Work from normal social play — no special match formats required.
- Be simple to update after each session (one form submission per session).
- Be visible to all players without requiring them to log in.
- Allow the ranking model to be recalibrated by changing settings and recalculating from raw data.

## 2. Users & Roles

### 2.1 Admin

- Authenticated via Google Sign-In.
- Manages the player list (add, edit status, remove).
- Manages system settings (rating algorithm parameters, activity thresholds).
- Can submit, edit, and delete any session.
- Can assign the Scorer role to other Google accounts.

### 2.2 Scorer

- Authenticated via Google Sign-In.
- Can submit new sessions.
- Can edit or delete sessions they submitted.
- Can add new players on-the-fly during session capture (name only; admin can enrich later).
- Cannot change system settings or manage other users.

### 2.3 Public (unauthenticated)

- Can view the ladder via a public URL.
- Can view session history.
- Can view per-player rating history/trend.
- No login required.

Most players will never log in. They consume the ladder via the public URL shared in WhatsApp or similar.

## 3. Session Capture

### 3.1 What is a session?

A session is a single social playing occasion. One form submission captures the entire session.

### 3.2 Session input

A session records:

- The players who participated (4–8 players).
- The number of games won by each player.
- An optional notes field.

No other gameplay detail is captured — no partners, opponents, points, or match structure.

### 3.3 Constraints

- Minimum 4 players per session.
- Maximum 8 players per session.
- Odd numbers of players are valid (rotation in social play).
- Games won must be zero or a positive integer.
- Total player-wins across the session must be even (each completed game produces 2 player-wins).
- Total player-wins must be greater than zero.
- No duplicate players in a session.
- All players must exist in the player list (or be added on-the-fly).

### 3.4 Corrections

- A scorer can edit or delete their own submitted sessions.
- An admin can edit or delete any session.
- When a session is edited or deleted, the system recalculates all ratings from scratch.

## 4. Player Management

### 4.1 Player records

Each player has:

- A stable unique ID (system-generated).
- A display name.
- A status: Active, Inactive (derived), or Removed (manual override).

### 4.2 Rules

- Players are never deleted — only marked as Removed.
- Removed players are hidden from the ladder but retained in historical calculations.
- New players can be added by an admin at any time, or by a scorer during session capture (name only).
- All players start at the same base rating (no manual seeding).

## 5. Rating & Ranking

### 5.1 Algorithm overview

The system uses a modified Elo-style rating algorithm adapted for multiplayer sessions where pairings are unknown. Key characteristics:

- **Expected share** is derived from each player's rating relative to all players present in the session.
- **Actual share** is the player's games won divided by total games won in the session.
- Ratings are updated based on the difference between actual and expected share.
- New players and returning players (after a long absence) receive a temporary rating multiplier to help their rating converge faster.
- An activity bonus rewards regular play.

### 5.2 Recalculation

- All ratings are rebuilt from raw session data and current settings whenever a recalculation is triggered.
- Recalculation is triggered automatically when a session is submitted, edited, or deleted.
- Changing settings requires a manual recalculation trigger (admin action).

### 5.3 Configurable settings

The algorithm has configurable parameters (K-factor, multipliers, thresholds, etc.) that an admin can adjust. Changing settings and recalculating updates the entire ladder from scratch. Default values are defined in the technical specification.

## 6. Ladder Display

### 6.1 Public ladder

The ladder is the primary output. It is visible at a public URL without authentication.

### 6.2 Ranking order

- **Active players** are ranked first, sorted by ladder score (rating + activity bonus) descending.
- **Inactive players** are listed below active players, sorted by last played date descending.
- **Removed players** are excluded.

### 6.3 Display information

The public ladder shows:

- Rank (1, 2, 3...).
- Player name.
- Status (Active / Inactive / Provisional).
- Movement indicator (↑↓—) compared to the ladder state before the most recent session.

Rating points and internal scores are not shown publicly.

### 6.4 Provisional players

Players in their first 5 sessions are marked as Provisional `(P)`. They are ranked normally but the marker sets expectations that their position is volatile.

## 7. Historical Views

### 7.1 Session history

A list of past sessions showing date, players, and games won. Visible to the public.

### 7.2 Player rating trend

A per-player view showing their rating over time. Visible to the public.

## 8. Scope & Scale

- Single club, single ladder (BSC).
- Approximately 20 players.
- 1–3 sessions per week.
- Full recalculation on every session change is acceptable at this scale.

## 9. Out of Scope for v1

- Multi-club / multi-ladder support.
- Notifications (email, WhatsApp bot, push).
- Head-to-head statistics (not possible given the data model).
- Player self-registration.
- Mobile app (web app should be mobile-friendly).
- WhatsApp copy-to-clipboard formatting.

## 10. Acceptance Criteria

1. An admin can manage players, settings, and assign the Scorer role.
2. A scorer can submit a session with 4–8 players and games won per player.
3. A scorer can add new players on-the-fly during session capture.
4. A scorer can edit or delete their own sessions.
5. Invalid sessions are rejected with clear error messages.
6. All ratings are recalculated from raw data when a session changes or settings are updated.
7. The public ladder URL shows ranked active players above inactive players, with movement indicators.
8. Provisional players are marked with `(P)`.
9. Removed players do not appear on the ladder.
10. Session history and per-player rating trends are publicly visible.
11. Authentication uses Google Sign-In for Admin and Scorer roles.
12. No login is required to view the ladder, session history, or player trends.
