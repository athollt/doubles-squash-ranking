# PRD — BSC Doubles Squash Ladder

*Date: 2026-06-05*
*Status: delivered (2026-06-07) — live at https://squash.tomlinson.co.za*
*Repo: https://github.com/athollt/doubles-squash-ranking*

---

## Problem Statement

BSC runs social doubles squash sessions where players rotate partners and opponents freely. There is no formal challenge-match structure, and players don't track who partnered whom. The club wants a visible, fair ranking of individual players based on session performance — updated after each session and accessible to all players without requiring a login.

Currently this is specified as a Google Sheets system. The club wants a proper web application that is mobile-friendly (PWA), publicly accessible, and simple to maintain.

## Solution

A mobile-first web application (PWA) that:

- Displays a public ladder showing ranked players with movement indicators.
- Allows authenticated scorers to submit session results via a simple form.
- Recalculates all ratings from raw session data on every change.
- Provides public session history and per-player rating trends.
- Is installable on phones via "Add to Home Screen".

## User Stories

### Public User (unauthenticated)

1. As a player, I want to view the current ladder at a public URL, so I can see where I rank without logging in.
2. As a player, I want to see movement indicators (↑↓—) next to each name, so I can tell who moved since the last session.
3. As a player, I want to see provisional players marked with `(P)`, so I know their ranking may be volatile.
4. As a player, I want to see inactive players listed below active players, so I can distinguish current players from absent ones.
5. As a player, I want to view a list of past sessions (date, players, games won), so I can recall what happened.
6. As a player, I want to view a specific player's rating trend over time, so I can see their progression.
7. As a player, I want to save the app to my home screen (PWA), so I can access the ladder like a native app.

### Scorer (authenticated)

8. As a scorer, I want to submit a session by selecting players and entering games won, so results are recorded after we play.
9. As a scorer, I want to select from a list of existing players when submitting a session, so I don't misspell names.
10. As a scorer, I want to add a new player on-the-fly during session capture (name only), so I don't need to ask an admin first.
11. As a scorer, I want to receive clear validation errors (e.g. "total wins must be even", "minimum 4 players"), so I can fix mistakes before submitting.
12. As a scorer, I want to edit a session I previously submitted, so I can correct mistakes.
13. As a scorer, I want to delete a session I previously submitted, so I can remove an incorrect entry.
14. As a scorer, I want to see the ladder update immediately after I submit/edit/delete a session, so I know my changes took effect.

### Admin (authenticated)

15. As an admin, I want to manage the player list (add, edit name, set status to Active/Removed), so I can maintain the roster.
16. As an admin, I want to edit or delete any session (not just my own), so I can correct data errors.
17. As an admin, I want to manage algorithm settings (K-factor, multipliers, thresholds, etc.), so I can tune the rating model.
18. As an admin, I want to trigger a full recalculation after changing settings, so the ladder reflects the new parameters.
19. As an admin, I want to manage users (grant/revoke Admin or Scorer role to Google accounts), so I can control who has write access.
20. As an admin, I want to see validation errors for invalid sessions, so I can identify and fix data problems.
21. As an admin, I want removed players to disappear from the ladder but remain in historical calculations, so data integrity is preserved.

### Branding & Identity

22. As a user, I want to see a recognisable logo and icon when I view the app or save it to my home screen, so it feels like a polished product.
23. As a user, I want the app to have a favicon and Apple touch icon, so it displays correctly in browser tabs and bookmarks.

## Implementation Decisions

### Architecture

- **Monorepo**: Single Next.js 15 (App Router) project — full-stack TypeScript.
- **Rendering**: Public pages use Server Components (fast initial load, SEO-friendly). Admin/scorer pages use Server Actions for mutations.
- **No separate API layer**: Data mutations are Server Actions, not REST endpoints.

### Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui components |
| ORM | Prisma |
| Database | PostgreSQL 16 (self-hosted, Docker) |
| Auth | Auth.js v5 + Google OAuth |
| PWA | Serwist (`@serwist/next`) |
| Reverse proxy | Caddy 2 (auto-SSL) |
| Hosting | Hetzner Cloud CX22, Cape Town |
| CI/CD | GitHub Actions → SSH deploy |
| Backups | `pg_dump` cron → Hetzner Object Storage |

### Data Model

```
users              — Google accounts with role (admin | scorer)
players            — Name roster (id, name, status, created_at)
settings           — Key-value pairs for algorithm parameters
sessions           — One row per form submission (id, submitted_by, timestamp, notes, is_valid, validation_errors)
session_players    — One row per player per session (session_id, player_id, wins)
ratings_log        — One row per player per valid session (full calculation audit trail)
```

**Not stored as tables** (computed on demand during full recalc):
- `current_ratings` — derived from the final state of `ratings_log`
- `ladder` — derived from `current_ratings` + activity bonus + sorting rules

**Movement tracking**: Store a `ladder_snapshots` table (or JSON column) with the previous ladder order. Compare on render to produce ↑↓— indicators.

### Rating Algorithm

Fully specified in `docs/plans/SPEC-original-google-sheets.md` §5–7. Key points:

- Modified Elo using expected share vs actual share across all players present.
- Full recalculation from raw data on every session change.
- Configurable parameters stored in `settings` table.
- New player multiplier (2.0×) for first 5 sessions.
- Returning player multiplier (2.0×) for 5 sessions after a 90-day absence.
- Activity bonus (capped) added to rating to produce ladder score.
- Session weight scales with session length (sqrt of inferred games / baseline).

### Authentication & Authorisation

- Google Sign-In only (Auth.js v5).
- `users` table acts as an allowlist — only listed emails can sign in.
- Role attached to JWT; middleware gates routes.
- Public routes: `/`, `/sessions`, `/players/[id]`.
- Scorer routes: `/submit`, `/sessions/[id]/edit`.
- Admin routes: `/admin/*`.
- Players are NOT linked to Google accounts.

### Route Structure

```
/                          — Public ladder
/sessions                  — Public session history
/players/[id]              — Public player rating trend
/unauthorised              — Shown when Google account not in users table

/submit                    — Submit session (Scorer, Admin)
/sessions/[id]/edit        — Edit session (Scorer own, Admin any)

/admin/players             — Manage players
/admin/sessions            — View/delete any session
/admin/settings            — Edit algorithm settings + trigger recalc
/admin/users               — Manage roles
```

### Branding & Assets

Create a visual identity for the app:

- **Logo**: A simple, modern logo incorporating squash/racket imagery suitable for a social club.
- **Favicon**: 16×16, 32×32 `.ico` or `.png`.
- **PWA icons**: 192×192 and 512×512 PNG (required for `manifest.json`).
- **Apple touch icon**: 180×180 PNG.
- **Open Graph image**: 1200×630 for link previews when the URL is shared in WhatsApp/social.
- **Colour palette**: Defined in Tailwind theme config; used consistently across logo and UI.

The logo and icons should be generated/designed during the build phase and placed in `/public`.

### PWA Configuration

- `manifest.json` with name "BSC Squash Ladder", short_name "Squash", display "standalone".
- Service worker via Serwist for offline fallback.
- Theme colour and background colour from the app's colour palette.
- HTTPS enforced via Caddy.

### Deployment

- Docker Compose: Postgres + Next.js + Caddy.
- Domain: `squash.tomlinson.co.za`.
- Caddy auto-provisions Let's Encrypt TLS.
- GitHub Actions builds Docker image → pushes to GHCR → deploys via SSH.
- Prisma migrations run automatically on deploy.
- First deploy seeds `atholl@tomlinson.co.za` as admin.

### Validation Rules (session submission)

A session is invalid if:

- Fewer than 4 players selected.
- More than 8 players selected.
- Any player has blank or negative wins.
- Total player-wins is odd.
- Total player-wins is zero.
- Duplicate players in the same session.
- A selected player does not exist in the players table.

Invalid sessions are rejected at submission time with clear error messages (not stored as invalid rows — unlike the Google Sheets model which stored everything and flagged invalids).

## Testing Decisions

- **Unit tests**: Rating algorithm (pure function) — test expected share calculation, session weight, multiplier logic, activity bonus, full recalc with known inputs.
- **Integration tests**: Session submission → recalculation → ladder output.
- **E2E tests**: Playwright — submit session as scorer, verify ladder updates; verify public pages load without auth.
- **Framework**: Vitest for unit/integration; Playwright for E2E.
- **Key test seam**: The recalculation engine is a pure function that takes sessions + settings and returns ratings. This is the primary unit test boundary.

## Out of Scope

- Multi-club / multi-ladder support.
- Notifications (email, WhatsApp bot, push).
- Head-to-head statistics.
- Player self-registration.
- Native mobile app.
- WhatsApp copy-to-clipboard formatting.
- Automated session capture (always manual form submission).
- Points or match-level detail beyond games won.

## Open Questions

None — all questions resolved during the BR and technical research phases.

## Reference Documents

- Business Requirements: `docs/plans/BR-doubles-squash-ladder.md`
- Original Specification: `docs/plans/SPEC-original-google-sheets.md`
- Technical Research: `docs/plans/RESEARCH-tech-stack.md`
