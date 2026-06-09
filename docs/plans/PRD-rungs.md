# PRD — Rungs (multi-tenant club ladder)

*Date: 2026-06-09*
*Status: ready-for-plan*
*Impacted: this repo (`doubles-squash-ranking` → to be rebranded **Rungs**); Fly.io infra*

> Rungs generalises the single **BSC Doubles Squash Ladder** into a multi-tenant
> product that hosts many independent club ladders. It **extends** the existing
> plan — same `docs/plans/` tree, same append-only `DECISIONS.md`, same
> `CHANGELOG.md` — it is not a fork. Grounding: [`CONTEXT-rungs.md`](CONTEXT-rungs.md)
> (glossary, frozen vocab) and [`DECISIONS.md`](DECISIONS.md) ADR-011…015.

---

## Problem Statement

The app today is hard-wired to one club's one ladder ("Doubles Squash @ BSC"):
the league name is a code constant in every page, there is one global roster, one
global set of rating settings, one global admin/scorer role, and the public ladder
is the site root. A second club cannot use it without forking and redeploying.

Two distinct user needs are unmet:

- **A new club** wants its own ladder — its own roster, scorers, rating settings,
  and a shareable URL — without standing up a separate deployment.
- **The instance owner** wants to provision those clubs and grant scoring access
  per club, while keeping the existing BSC ladder running with no data loss.

The rating engine itself is *not* the problem: it already rates **individuals**
across **sessions** from a flat `{ playerId, wins }[]` (it never modelled
partnerships), so it is sport-agnostic as-is. The work is **tenancy + access +
routing + rebrand**, not a rating rewrite.

## Solution

Make **League** the single tenant. One app, many Leagues, each with its own
roster, settings, scorers, ladder, and URL (`/l/{slug}`). Authentication becomes
**staff-only** (a global Admin plus per-league Scorers); the public still views any
League's ladder without logging in. Rebrand the product to **Rungs** (neutral
identity, the "Climb" logo). Migrate the live BSC data into a seed League so
nothing is lost.

This is **v1** — deliberately the smallest multi-tenant cut that lets a second
club run. See **Out of Scope** for what is explicitly deferred.

## User Stories

### Instance owner / global Admin
1. As a global Admin, I want to create a League (name + sport-flavoured display
   name), so that a new club can have its own ladder.
2. As a global Admin, I want a URL slug suggested from the League name that I can
   edit before creating, so that the League gets a clean, memorable URL.
3. As a global Admin, I want each League to start with the default rating settings,
   so that a new League is immediately usable and I can tune later.
4. As a global Admin, I want to assign a Scorer to a specific League (by email),
   so that club volunteers can log sessions for their League only.
5. As a global Admin, I want to administer, score in, and edit any session in any
   League, so that I can support every club.
6. As a global Admin, I want to review pending access requests and approve or
   dismiss them, so that I can grant scoring access without leaving the app.
7. As a global Admin, I want approving a request to create the user and the
   per-League grant in one step, so that access management is one action.
8. As a global Admin, I want to edit a League's rating settings (and trigger a
   per-League recalculation), so that each club can tune its own algorithm.

### Scorer (per-League)
9. As a Scorer, I want to sign in and see only the League(s) I'm granted, so that
   I'm not exposed to other clubs' data.
10. As a Scorer, I want to submit a session for a League I'm granted, so that I can
    log results for my club.
11. As a Scorer, I want to manage my League's players (add/rename/deactivate),
    including adding a player inline while submitting, so that data entry is quick.
12. As a Scorer, I want to edit or delete only the sessions I submitted, so that I
    can fix my own mistakes but not alter another scorer's results.
13. As a Scorer, I want all my actions scoped to the League in the URL, so that I
    can't accidentally affect another League.

### Public visitor
14. As a public visitor, I want to open a League's ladder at its URL without
    logging in, so that I can see the club's rankings.
15. As a public visitor, I want a League's session history and per-player rating
    trend (as today), scoped to that League, so that I can explore its results.
16. As a public visitor, I want a shared ladder link to keep working over time, so
    that bookmarks and WhatsApp shares don't break (slug is immutable).

### Non-staff Google user
17. As a signed-in non-staff user, I want a clear "this sign-in is for scorers and
    admins" page, so that I understand why I see nothing.
18. As a signed-in non-staff user, I want to request Scorer access for a specific
    League, so that an admin can grant me access.

### Continuity / migration
19. As the BSC club, I want my existing ladder, players, sessions, ratings, and
    history preserved as a League, so that switching to Rungs loses nothing.
20. As the instance owner, I want a verified backup taken before the migration, so
    that the riskiest change is recoverable.

### Rebrand
21. As any user, I want the app to present as **Rungs** (neutral name, "Climb"
    logo, slate/indigo/coral), not "BSC Squash", so that it reads as a product that
    hosts many clubs.
22. As the instance owner, I want the production app/domain renamed off "squash"
    (Fly app + `rungs.tomlinson.co.za`), so that infra matches the brand.

## Implementation Decisions

Anchored in ADR-011…015 (see [`DECISIONS.md`](DECISIONS.md)). The codebase's
**pure-core / thin-shell** pattern (pure `lib/` logic + store ports, thin Server
Actions/Components) is what makes this tractable — most tenancy logic lands in
pure, unit-tested functions.

**Tenancy (ADR-011).** Introduce a `League` model (name, displayName, slug,
createdAt). Add `leagueId` to `Player`, `Session`, `Setting`, `RatingsLog`,
`LadderSnapshot`. `Setting` uniqueness moves from `key` to `(leagueId, key)`.
Player name uniqueness scopes to `(leagueId, name)`. Recalc store queries
(`prismaRecalcStore`) gain `where: { leagueId }`; recalc runs per-League.

**Identity & access (ADR-012).** `User` stays staff-only. Keep the global `ADMIN`
role; add a `LeagueScorer(userId, leagueId)` grant table — a `SCORER`'s authority
is the set of their grants. The pure `authorizeRoute` is extended: public allows
`/l/{slug}` ladder/history/player routes; `/l/{slug}/submit` and
`/l/{slug}/admin/*` require a grant on that slug's League (Admin bypasses). The
pure `canMutateSession` keeps the own-sessions rule and gains a League-scope guard.
Sign-in stays gated by the admin-managed allowlist (the `User` row must exist).

**Routing (ADR-013).** Path-prefix `/l/{slug}/...`. `/` becomes a signed-out
landing / staff entry (a signed-in Admin sees all Leagues; a Scorer sees their
granted Leagues). Slug: suggested from name, editable at creation, unique,
immutable. Single shared PWA identity ("Rungs").

**Access requests (ADR-014).** `AccessRequest(email, name, leagueId, status,
createdAt)`. The non-staff bounce page offers "Request scorer access" for a chosen
League; an admin page lists pending requests; approve creates the `User` +
`LeagueScorer` grant. No email.

**Migration (ADR-015).** A data migration creates a "BSC Doubles Squash" League
(slug `bsc-doubles-squash`), back-fills `leagueId` on all existing rows, splits the
global `Setting` values into that League's settings, and attaches current staff as
its members (the admin stays global ADMIN). Run only after a verified backup.

**Rebrand.** Replace the squash-specific strings (page titles, `layout.tsx`,
`manifest.json`, `~offline`, logo/icon/OG SVGs) with the Rungs identity; per-page
titles render the **League** name, not a constant. Rename the Fly app + database
and the domain to `rungs.tomlinson.co.za` (update `AUTH_URL`, OAuth redirect URIs,
Fly secrets, `DEPLOYMENT.md`).

### Affected repos

| Repo | Why |
|------|-----|
| `doubles-squash-ranking` (→ Rungs) | All application + schema + rebrand changes. |
| Fly.io / infra | App + DB + domain rename; OAuth redirect URIs; secrets. |

## Design / UX

- **Platform intent**: unchanged — mobile-first PWA. Single shared PWA identity
  (Rungs); per-League branding is out of scope.
- **Look-and-feel / CI**: rebrand to **Rungs** — the "Climb" ascending-rungs logo
  (square app-icon + horizontal wordmark lockup), palette **slate ground / indigo /
  coral accent** (deliberately not the old squash blue/yellow). Reuse the existing
  design-system primitives (built in steps 13.4–13.5); this is a re-skin + new
  shell chrome, not a new design system.
- **Component inventory**: a **League switcher / context** in the nav chrome
  (which League am I in / which can I act on); a **landing / your-Leagues** view at
  `/`; a **non-staff bounce page** with the access-request action; an **admin
  League list + create-League form**; an **admin access-request queue**. Existing
  ladder/submit/history/player/admin screens are re-scoped to a League, not
  redesigned.
- **Frozen vocabulary** (CONTEXT-rungs.md): Player, Session, Wins, Rating, Ladder,
  Scorer — do not relabel or make per-League configurable.

## Testing Decisions

- **Good test = observable behaviour, not internals**, exercised at the highest
  pure seam — matches the repo's pure-core convention.
- **Pure `lib/` units (no DB)**: `authorizeRoute` (public `/l/{slug}` allowed;
  `/l/{slug}/submit` and admin require a grant; Admin bypass; immutable-slug
  irrelevant to auth), `canMutateSession` (own-session rule + League scope),
  slug generation/validation (suggest-from-name, uniqueness, format), per-League
  recalc input shaping, access-request approve→grant logic.
- **Server Actions / Components (thin)**: League create, scorer grant, access-
  request approve/dismiss, league-scoped player/session mutations — tested via the
  store-port pattern already used (`prismaRecalcStore`, player/user/recalc stores).
- **Migration**: a test that, given representative pre-migration data, asserts all
  rows carry the seed League's `leagueId`, settings are split correctly, and the
  ladder recomputes identically to pre-migration (no rating drift).
- **E2E (Playwright, per PLAN.md route rule)**: any step adding/altering a route
  adds journeys — create a League; grant a scorer; scorer submits in their League
  and is blocked from another; public views `/l/{slug}` without login; non-staff
  sign-in → bounce → request access → admin approves. Use the ephemeral test-user /
  test-data pattern from step 05.1 (global setup/teardown, never seeded).
- **Frameworks** (per `OVERVIEW.md`): Vitest (unit) + Playwright (E2E).

## Out of Scope (v1 — deferred to v2+)

- **Follow / cross-league player tracking** ("my players", players signing in).
  Its absence is *why* login is staff-only and there is no cross-league player
  identity.
- **Self-serve signup** (anyone creates a League) — v1 is admin-provisioned.
- **Billing / quotas / plans.**
- **Subdomains, custom domains, and per-League branding** (logos/colours/per-League
  PWA manifest). v1 is path-prefix + single shared identity.
- **Variable match formats** (singles vs doubles, variable players-per-session).
  The engine is individual + format-agnostic and **unchanged**.
- **Club / Org layer / shared rosters across Leagues.**
- **Email / push notifications** (including emailing admins on access requests).
- **Slug rename / redirects** (slug is immutable after creation).

## Open Questions

None blocking — the full design tree was resolved in the grill (this session).
Naming, branding, tenancy model, access model, routing, settings scope, and
migration approach are all decided (ADR-011…015). `create-plan` may sequence the
infra rename (ADR-013/rebrand) and the data migration (ADR-015) as their own steps
given their risk.

## Reference Documents

- Decisions: [`DECISIONS.md`](DECISIONS.md) ADR-011…015 · Context:
  [`CONTEXT-rungs.md`](CONTEXT-rungs.md)
- Rebrand prototype notes: `zTemp/rebrand-prototype/PROTOTYPE-NOTES-rebrand.md`
  (gitignored — decision mirrored in CONTEXT-rungs.md + ADR-013)
- Prior product: [`PRD-doubles-squash-ladder.md`](PRD-doubles-squash-ladder.md) ·
  Plan: [`PLAN.md`](PLAN.md) · Changelog: [`CHANGELOG.md`](CHANGELOG.md)
- Agent notes: [`../../AGENT-NOTES.md`](../../AGENT-NOTES.md)
