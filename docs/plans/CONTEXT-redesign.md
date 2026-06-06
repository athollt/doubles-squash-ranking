# Mobile-First Redesign — Context

Covers the PWA-first redesign of the doubles squash ladder: UX (navigation/structure)
and Design/CI (look-and-feel), prototyped before any shared-component refactor.

## Language

**PWA-first**:
The installed Progressive Web App on a phone home screen is the primary experience to
design for. The browser website is back-ported from the winning PWA design, not the
other way round.
_Avoid_: responsive web, mobile site

**Redesign**:
Both UX (navigation model, screen structure, interaction flow) AND Design/CI
(visual identity, palette, components) — not a reskin of the existing layout.

**Design-system foundation**:
A shared set of UI primitives (page shell, card, badge, nav chrome) plus a
"reuse before you build" rule, established *before* feature pages are written.
Its absence is the root cause of the current cross-screen inconsistency.

**Scorer-submission journey**:
A scorer entering session results on a phone, courtside, right after play. One of two
first-class phone journeys (the other is public ladder viewing). The make-or-break
interaction for the SCORER role.

## User-facing glossary (locked in step 13.3)

The vocabulary the UI shows players. Pinned during the UX prototype so the
design-system (13.4) and rollout (13.5) use one consistent set. **Internal/DB names are
unchanged** (e.g. the Prisma `Session` model, `SessionPlayer.wins`, `ladderScore`,
`currentRating`, `sessionsLast90Days`) — this glossary governs *display copy only*.

**Score** (ladder column):
The number a player is ranked by, shown rounded. Maps to the engine's `ladderScore`
(rating + activity bonus) — deliberately the *ranked* number, so the displayed value
never contradicts the rank order.
_Avoid_: Rating (the raw `currentRating` skill number — engine-internal, not shown),
Points.

**Played** (ladder column):
How many sessions a player has turned up to in the last 90 days. The activity/turnout
signal (maps to `sessionsLast90Days`).
_Avoid_: Recent, Sessions, Games, Matches, Nights, Form.

**Trend** (ladder column):
Rank change since the previous snapshot, shown as ▲n / ▼n / — / NEW.
_Avoid_: Move, Movement, Change.

**New** (player badge):
A player with too few sessions for a stable rating (still shown, flagged).
_Avoid_: Provisional, PROV, Unranked.

**Session** (the submitted unit):
One occasion of social doubles play, submitted as a single result (4–8 players, each
with a wins count). **Kept** as the internal/DB term and in nav/history ("Sessions",
"Session history"). The submit *button* uses warmer copy ("Log tonight's results")
rather than "Submit a session".
_Avoid_ (as a rename of the concept): Night, Play, Round, Match.

**Wins** (per-player input):
The number of games a player won during the session (maps to `SessionPlayer.wins`).
Labelled "wins" on the submit screen.
_Avoid_: Games, Games won (the word "game" tested as confusing), Points.

**Active / Inactive**:
Whether a player has played inside the 90-day activity window. Inactive players move to
a separate list. Kept as-is.

**Settled, unchanged**: Player, Ladder, Rank (#), Notes, Sign in, Admin, Settings,
User, Submitted by.
