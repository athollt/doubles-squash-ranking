# Step 17: Inline new-player on Submit, rename users, verify backups

## Objective
Three small, unrelated improvements from testing feedback:
1. Add a new player **inline on the Submit page**, without leaving the flow.
2. Let an admin **rename a User** (login account).
3. **Verify production backups** are actually configured (no code change expected).

The two larger ideas from the original `step-17-ideas.md` — making the app generic
(multi-sport) and multi-league/multi-tenant — are **out of scope here**. They are a
separate product and get their own PRD + plan (see "Out of scope" below). The two
remaining ideas in that file (WhatsApp message format, multiline notes) were already
shipped in commit `03dd15a`.

## Context
- Read first: `CHANGELOG.md` step 16.2 (pick-players-then-score submit flow) and
  step 16.5; `DECISIONS.md` ADR-004 (users ≠ players, no FK) and ADR-010 (scorers
  may manage Players & Sessions; `/admin/users` stays ADMIN-only); ADR-008 (backups).
- **Players domain logic already exists.** `lib/players.ts` exports
  `createPlayer(name, store)` — name-only, trims, case-insensitive duplicate check,
  returns the created `PlayerRecord`. The inline flow **reuses this** — no new
  player domain logic.
- **Users have no rename path yet.** `lib/users.ts` has `createUser` and
  `updateUserRole` but **no** name update, and `UserStore` has no `updateName`.
  This step adds both (mirroring `updatePlayerName` in `lib/players.ts`).
- Submit UI: `app/submit/page.tsx` → `components/session-form.tsx`. The form holds
  the chosen players client-side (the chip-picker `entries` state) and reads the
  selectable player roster from the server page. Players are created via the
  server action in `app/admin/players/actions.ts` (reuse, don't duplicate).
- Users admin UI: `app/admin/users/` (page + `actions.ts`), ADMIN-only per ADR-010.

## Decisions baked into this step (from grilling)
- **Inline new-player — inline-expand, not modal.** The existing "New" affordance on
  Submit reveals an inline name input + confirm (per the ideas note "the button
  could become editable"). On confirm it calls the existing create-player server
  action; on success the new (ACTIVE) player is **selected straight into the slot**
  being filled and added to the roster client-side.
- **Who:** scorers get the inline button too, not just admins — consistent with
  ADR-010 (`requireUser` already gates player create). No new authz.
- **Duplicate name on inline create:** `createPlayer` returns
  `{ ok: false, error: "A player with that name already exists." }`. Show that error
  **inline under the input; do not auto-select.** The scorer clears it and picks the
  existing player from the normal list.
- **Rename users = login-account name, ADMIN-only.** Add
  `updateUserName(id, name, store)` to `lib/users.ts` (trim, reject empty; **no**
  uniqueness check — names aren't unique, unlike emails) and `UserStore.updateName`.
  Surface as a rename action on `/admin/users`, gated like the existing user
  actions (ADMIN-only, server-side). **No cascade:** per ADR-004 a User's name does
  not appear on any ladder/session/history view (those use *player* names), so
  renaming touches only `/admin/users` and the signed-in nav label.
- **Backups — verification, not a feature.** ADR-008 records the intended design
  (Fly **volume snapshots**, daily, ~5-day retention; a `pg_dump`→object-storage
  cron noted as deferred). This step **confirms snapshots are actually enabled on
  the prod Postgres volume** and records the finding in `CHANGELOG.md`. If
  snapshots are *not* on, flag it for the human — do not silently change prod.

## Specification (behaviours, in TDD order)

### Rename users (domain first — has new logic)
1. `updateUserName` trims the name and returns `{ ok: false, error: "Name is required." }` for empty/whitespace.
2. `updateUserName` with a valid name calls `store.updateName(id, trimmed)` and returns `{ ok: true, user }`.
3. `UserStore` gains `updateName(id, name)`; the Prisma-backed store implements it.
4. `/admin/users` server action exposes rename, ADMIN-only (mirror the existing
   role-update action's guard). Invalid/empty name → inline error, no write.

### Inline new-player on Submit (UI — reuses player create)
5. On Submit, activating "New" reveals an inline name input + confirm/cancel.
6. Confirm with a fresh name → player created (ACTIVE) via the existing action,
   selected into the slot, added to the in-memory roster.
7. Confirm with a duplicate name → inline error shown, slot unchanged, no selection.
8. Confirm with empty name → inline "Name is required." (reuses `createPlayer`'s validation).

### Backups (verification step — no test, recorded in CHANGELOG)
9. Confirm Fly volume snapshots are enabled on the prod Postgres volume (e.g.
   `fly volumes list` / `fly volumes snapshots list <vol>`); record the result and
   retention in `CHANGELOG.md`. If absent, surface to the human.

## E2E (per PLAN.md route rule)
- **Touches user-facing routes** (`/submit`, `/admin/users`) → extend Playwright:
  - Submit: open inline new-player, create a player, see it selected; duplicate name shows inline error.
  - Users: admin renames a user; the new name shows in the list.
- Use the ephemeral test-user / test-data pattern from step 05.1 (created in global
  setup, deleted in teardown — never left in the seed).

## Validation
```bash
npm run build && npm run test
npm run test:e2e   # local Postgres up + migrated
```

## Out of scope (own PRD + plan, next session)
- **Generic / multi-sport relabel** and **multi-league / multi-tenant** (per-league
  scorer grants, league-scoped recalc & seed, a league-admin tier above ADMIN).
  These are a different product from "BSC Doubles Squash Ladder" and will be grilled
  into a new `PRD-generic-ladder.md` (or similar) and a separate plan. The rating
  engine is **already format-agnostic** — it takes a session as a flat
  `{ playerId, wins }[]` and rates individuals — so the genericness is a relabel +
  tenancy problem, not a rating-engine rewrite. That analysis seeds the new PRD.
```