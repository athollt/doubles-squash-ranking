# Step 21: Path-prefix routing — `/l/{slug}` + slug lifecycle

## Objective
Move every league-scoped page under `/l/{slug}/...`, keep public league ladders
login-free, and implement the slug lifecycle (suggest, validate, immutable).

## Context
- Read first: `DECISIONS.md` **ADR-013** (path-prefix routing, public ladder, immutable
  slug, single PWA identity); **ADR-009** (share text embeds the ladder URL — why slug
  must be immutable); `PRD-rungs.md` → Routing.
- Today's routes (`app/`): public `/`, `/sessions`, `/sessions/[id]`, `/players/[id]`;
  auth'd `/submit`, `/sessions/[id]/edit`; admin `/admin/{players,sessions,settings,users}`.
  `proxy.ts` calls the pure `authorizeRoute` (extended in step 20).
- This step is the big routing move; it depends on step 20's authz logic and step 19's
  league-scoped reads.

## Specification
**Routing**: re-scope league pages under `/l/{slug}/`:
- Public: `/l/{slug}` (ladder), `/l/{slug}/sessions`, `/l/{slug}/sessions/[id]`,
  `/l/{slug}/players/[id]` — viewable without login.
- Scorer: `/l/{slug}/submit`, `/l/{slug}/sessions/[id]/edit`.
- Admin (per-league): `/l/{slug}/admin/{players,sessions,settings}`.
- Global admin (not league-scoped): account/role management stays at a top-level
  admin route (e.g. `/admin/users`) — unchanged gate.
- Resolve `{slug}` → League at the page boundary; unknown slug → 404. Update
  `authorizeRoute`/`isPublicRoute` to recognise the `/l/{slug}` shapes (logic from
  step 20) and `proxy.ts` to pass the slug's league context.

**Slug lifecycle** (pure helper + store): `suggestSlug(name)` slugifies the league
name; validation enforces format + uniqueness; **no rename path** (immutable after
creation — creation form is step 22, but the pure helpers land here with their tests).

**Share text / links**: any absolute ladder URL (ADR-009 share helper, `AUTH_URL`
usage) now points at `/l/{slug}` for the relevant league.

**Behaviours to verify (TDD order):**
1. `suggestSlug`: "BSC Doubles Squash" → `bsc-doubles-squash`; trims/deduplicates
   separators; rejects empty.
2. Slug validation: rejects bad format; rejects an already-taken slug.
3. `authorizeRoute` over `/l/{slug}/...`: public ladder/history/player → allow without
   auth; submit/edit/admin → requires grant (per step 20); unknown-shape → existing
   behaviour.
4. The seed BSC League's pages are reachable at `/l/bsc-doubles-squash/...` and the old
   root behaviour is handled (root → step 22 landing; for now redirect/placeholder).

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
Routes change → **E2E required**: public views `/l/{slug}` without login; a granted
scorer submits under their slug; a non-granted scorer is blocked from another slug.
Use the ephemeral test-user/test-data pattern (step 05.1).

## Completion
1. Update `CHANGELOG.md` (note `/` is a placeholder until step 22).
2. Mark step 21 complete in `RUNGS-PLAN.md`.
3. Commit `step-21: path-prefix routing — /l/{slug} + slug lifecycle`.
4. Push `at-wip`.
