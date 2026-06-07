# Rating Algorithm — Technical Reference

How a player's rating, ladder position, and active/inactive status are computed.

**Source of truth:** [`lib/rating-engine.ts`](../lib/rating-engine.ts) — the pure
`recalculate(input)` function. Everything here is validated against that code (cross-checked
with the original [`SPEC §5–7`](plans/SPEC-original-google-sheets.md)). If the code and this
doc ever disagree, the code wins — fix the doc.

> **Step 16 note:** this is the *technical* reference. A player-facing, plain-English
> version of this explanation is distilled from it into the app itself in step 16
> (in-app "How ratings work"). Keep this doc the canonical source; the in-app copy derives
> from it.

## Core principle

Ratings are **recomputed from scratch** on every change (submit / edit / delete a session)
— there is no incremental update ([ADR-001](plans/DECISIONS.md)). The engine replays **all**
sessions in chronological order and derives current ratings and the ladder from the result
([ADR-002](plans/DECISIONS.md) — nothing is stored as a cache). At club scale this is
trivial and always correct.

Doubles partners and opponents are **not** recorded — only who played and how many games
each won. The algorithm therefore works on each player's **share of the session's wins**
versus the share their rating *predicts*, weighted by who else was present.

## The settings

All values are stored in the `Setting` table and **editable by an admin** on the Settings
page — the numbers below are the **seeded defaults** ([`prisma/seed.ts`](../prisma/seed.ts),
from SPEC §4.2). Live values may differ if an admin has changed them.

| Setting | Default | Role in the formula |
|---|---|---|
| `StartingRating` | 1000 | Rating every player begins at, and the strength-weight baseline. |
| `StrengthScale` | 400 | Scale in the strength-weight exponent — how steeply rating gaps translate into expected win share. |
| `KFactor` | 160 | Overall sensitivity — how big a rating change one session can produce. |
| `NewPlayerMultiplier` | 2.0 | Rating-change multiplier while a player is new. |
| `NewPlayerSessions` | 5 | Number of a player's first sessions that get the new-player multiplier. Also the **provisional** threshold. |
| `ReturningPlayerMultiplier` | 2.0 | Rating-change multiplier after a long absence. |
| `ReturningPlayerSessions` | 5 | Sessions the returning multiplier applies for, after a return. |
| `LongAbsenceDays` | 90 | Gap (since last play) that triggers the returning-player boost. |
| `BaselineSessionGames` | 8 | "Normal" session length; sessions longer/shorter scale up/down from here. |
| `MinSessionWeight` | 0.6 | Lower clamp on session weight. |
| `MaxSessionWeight` | 1.25 | Upper clamp on session weight. |
| `ActivityBonusPerSession` | 2 | Ladder-score bonus per recent session. |
| `ActivityBonusWindowDays` | 90 | Window for counting "recent" sessions (for the activity bonus). |
| `ActivityBonusCap` | 30 | Maximum activity bonus. |
| `ActiveThresholdDays` | 90 | Max days since last play to still count as **active** on the ladder. |

## The algorithm, step by step

Sessions are processed **oldest → newest** (`rating-engine.ts` sorts by timestamp). A
player with no prior rating is treated as `StartingRating` (1000).

### 1. Session totals

For each session:

```
TotalPlayerWins = Σ wins over all players in the session
InferredGames   = TotalPlayerWins / 2          (each game produces one win)
```

`ActualShare` for a player is their slice of the session's wins:

```
ActualShare = PlayerWins / TotalPlayerWins
```

### 2. Strength weight & expected share

Each player's **strength weight** grows exponentially with how far their (current) rating is
above the starting rating:

```
StrengthWeight = exp((RatingBefore − StartingRating) / StrengthScale)
```

A player's **expected share** of the wins is their strength weight relative to everyone
present in that session:

```
ExpectedShare = StrengthWeight / Σ StrengthWeight (all players in the session)
```

This is what lets the engine account for *who was in the room* without knowing the exact
pairings: a strong player is expected to take a larger share of the wins, so winning a
"normal" share against strong company still nudges their rating up less than the same share
against weak company.

### 3. Session weight

Longer sessions count for more — but with diminishing returns (square root), clamped:

```
RawSessionWeight = sqrt(InferredGames / BaselineSessionGames)
SessionWeight    = clamp(RawSessionWeight, MinSessionWeight, MaxSessionWeight)
```

At the baseline length (`InferredGames == BaselineSessionGames`) the raw weight is `1.0`.

### 4. New / returning multiplier

A multiplier accelerates rating movement while a player is still being placed:

- **New player** — for their first `NewPlayerSessions` sessions
  (`SessionsPlayedBefore < NewPlayerSessions`), multiplier = `NewPlayerMultiplier`.
- **Returning player** — if the gap since their last session is `≥ LongAbsenceDays`, a
  counter is (re)armed to `ReturningPlayerSessions`; while it is positive the multiplier is
  `ReturningPlayerMultiplier`, decrementing each session played.
- Otherwise the multiplier is `1.0`.

New takes precedence over returning when both could apply.

### 5. Rating change

```
RatingChange = KFactor × SessionWeight × Multiplier × (ActualShare − ExpectedShare)
RatingAfter  = RatingBefore + RatingChange
```

A player who wins **more** than their strength predicted gains; **less**, loses. The size
scales with the K-factor, the session's weight, and any new/returning multiplier.

Every player-session is written to `RatingsLog` with all the intermediate terms
(`strengthWeight`, `expectedShare`, `actualShare`, `sessionWeight`, `multiplier`,
`ratingChange`, `ratingAfter`, …) — that is what powers the per-player trend page.

### 6. Activity bonus & ladder score

After all sessions are replayed, for each player (evaluated as of "now"):

```
SessionsLast90Days = count of the player's sessions within ActivityBonusWindowDays of now
ActivityBonus      = min(ActivityBonusCap, SessionsLast90Days × ActivityBonusPerSession)
LadderScore        = CurrentRating + ActivityBonus
```

The **ladder score** (rating + activity bonus) is the number players are ranked by — so
turning up regularly is rewarded, up to the cap.

### 7. Active / inactive / removed

- **Active** — not removed, has history, and `now − LastPlayed ≤ ActiveThresholdDays`.
- **Inactive** — not removed, has history, but last played longer ago than the threshold.
- **Removed** — `status = REMOVED`. Excluded from the visible ladder, but **kept in history
  and in the recalculation** ([ADR-004](plans/DECISIONS.md) — players are a name roster, not
  linked to login accounts).
- Players with **no sessions** are not ranked at all.

### 8. Ladder ordering & badges

```
Group 1 — Active players,   sorted by LadderScore   descending
Group 2 — Inactive players, sorted by LastPlayedDate descending
(Removed players excluded.)
```

Per row the engine also derives:

- **Provisional** — `SessionsPlayed < NewPlayerSessions` (still inside the new-player window;
  shown as a `(P)` / "New"-style badge).
- **Movement** — comparing this rank to the previous ladder snapshot: `up N` / `down N` /
  `same` / `new`. (The page feeds the *previous* snapshot's rankings in as
  `previousRankings`; see [CHANGELOG step 09](plans/CHANGELOG.md).)

## Worked intuition

- Two players, both rated 1000, play a baseline-length session 3–1.
  `ExpectedShare = 0.5` each; the winner's `ActualShare = 0.75`. With `SessionWeight ≈ 1`,
  `Multiplier = 1`: `RatingChange = 160 × 1 × 1 × (0.75 − 0.5) = +40` for the winner, `−40`
  for the loser.
- The same result in a player's **first** session doubles the swing (`Multiplier = 2.0`) —
  new players find their level fast.
- A 1200-rated player among 1000-rated players has a higher `ExpectedShare`, so they must win
  a *bigger* share just to hold station — ratings self-stabilise.

## Where this runs

- Pure engine: [`lib/rating-engine.ts`](../lib/rating-engine.ts) (`recalculate`).
- Orchestration (load settings/players/sessions → run engine → write `RatingsLog` +
  `LadderSnapshot`): [`lib/recalc.ts`](../lib/recalc.ts) over a store port, with the
  Prisma-backed store in [`lib/recalc-store.ts`](../lib/recalc-store.ts).
- Triggered by every session submit/edit/delete and by **Save & Recalculate** on the admin
  Ratings page (`/admin/settings`).
