# Rungs — Context

Generalising the single BSC doubles-squash ladder into **Rungs**: a multi-tenant
product hosting many independent club ladders, for any sport where members play
sessions and you count each person's games won. This glossary pins the vocabulary
for the rebrand + multi-tenant work. Glossary, not spec — see `DECISIONS.md`
ADR-011…015 for the decisions and `PRD-rungs.md` (to be written) for the spec.

## Language

**Rungs**:
The product / platform name and PWA identity (logo: the "Climb" ascending-rungs
mark; palette slate/indigo/coral). The app *shell*, not any one ladder. Replaces
the old "BSC Doubles Squash Ladder" branding.
_Avoid_: "the squash app", "the ladder app" (Rungs hosts many ladders).

**League**:
The single tenant. One League = one ladder = one roster = one set of scorers =
one URL (`/l/{slug}`) = one set of rating settings. Flat — there is no Club or Org
above it. Two ladders for the same physical club are two independent Leagues.
_Avoid_: Tenant (internal-only), Club, Competition.

**Slug**:
The URL-safe League identifier in `/l/{slug}`. Suggested from the League name,
editable at creation, unique, **immutable** afterwards.

**Player**:
A name on a League's roster — *not* a login. Belongs to exactly one League. No
cross-league player identity (the same human in two Leagues is two Players).
Unchanged from the original model (users ≠ players, ADR-004).
_Avoid_: Member, Competitor, User (User is a distinct thing — see below).

**Session**:
One bounded play event on a date, in which individuals each accrue a count of
**Wins**. The unit the rating engine consumes (`{ playerId, wins }[]`). Generic
across sports — a padel Americano night, a squash box round, a darts evening are
all Sessions. **Frozen, canonical — not per-league configurable.**
_Avoid_: Match, Round, Night, Fixture, Game (these are not relabels of Session).

**Wins**:
A player's count of games/points won within a Session. The only per-player input to
the rating engine. **Frozen** — not "Points"/"Score" per league.

**Rating / Ladder / Scorer**:
Unchanged, sport-neutral, **frozen** canonical terms. Rating = the individual
Elo-style number; Ladder = the ranked, computed view of a League; Scorer = a staff
role that logs Sessions.

**Staff**:
The only people who log in. Either a global **Admin** or a **Scorer**. The `User`
table holds staff only — never Players, never followers.
_Avoid_: using "User" loosely to mean a Player or a public visitor.

**Admin** (global):
A Staff role spanning all Leagues: creates Leagues, assigns Scorers, edits any
League's settings/sessions, and may score in any League. Seeded with one.

**Scorer** (per-league):
A Staff role whose authority comes entirely from per-League grants
(`LeagueScorer`). A Scorer acts only on Leagues they are granted, and edits only
their own Sessions (ADR-010 ownership rule, now league-scoped).

**Access request**:
An in-app request (`AccessRequest`) raised by a signed-in non-staff Google user
asking to become a Scorer for a chosen League. An Admin approves (→ creates the
User + grant) or dismisses. No email — see ADR-014.

**Follower** (reserved — OUT of scope for v1):
A future concept: any Google user who tracks Players across Leagues. Reserved here
so the term isn't reused. Its absence is *why* login is staff-only (ADR-012) and
*why* there is no cross-league player identity (ADR-011).
