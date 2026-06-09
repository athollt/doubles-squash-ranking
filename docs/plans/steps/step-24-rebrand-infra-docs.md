# Step 24: Rungs rebrand, infra rename & docs

## Objective
Re-skin the (now multi-tenant) app as **Rungs**, rename the production infra off
"squash", and close the documentation loop. This is the final step.

## Context
- Read first: `DECISIONS.md` **ADR-013** (single shared PWA identity, name = Rungs),
  **ADR-008** (Fly hosting); `CONTEXT-rungs.md` (Rungs, frozen vocab); `PRD-rungs.md` →
  Design/UX + User Stories #21, #22; `zTemp/rebrand-prototype/PROTOTYPE-NOTES-rebrand.md`
  (name = Rungs, logo = "Climb" mark, palette slate/indigo/coral) — decision mirrored
  in CONTEXT-rungs.md if the gitignored notes are gone.
- **Rebrand lands late by design** — screens are now re-scoped (steps 21–23), so we
  re-skin stable targets, not moving ones.
- Squash-specific strings to replace (from the grill's grep): page titles in every
  `app/**/page.tsx`, `app/layout.tsx` (title/description/OG/appleWebApp), `app/page.tsx`,
  `public/manifest.json` (name/short_name/description), `app/~offline/page.tsx`, the logo
  SVGs (`icon.svg`/`logo.svg`/`og.svg`), and `AUTH_URL`/domain references.

## Specification
**Rebrand (cosmetic, in-app):**
- Replace the product identity with **Rungs**: new "Climb" ascending-rungs logo (square
  app-icon + horizontal wordmark lockup), palette slate ground / indigo / coral accent
  (replace the squash blue/yellow). Update `manifest.json`, icons, OG, apple-touch-icon,
  `viewport.themeColor`.
- **Per-page titles render the League name**, not a hard-coded constant — the page is
  "{League displayName} — Rungs", driven by the resolved league (step 21), with the bare
  shell as just "Rungs".
- Frozen vocab unchanged (CONTEXT-rungs.md): do not relabel Player/Session/Wins/etc.

**Infra rename (manual/ops — hard to reverse, do last):**
- Rename the Fly app + Postgres off `bsc-squash-*`; point the domain to
  `rungs.tomlinson.co.za`; update `AUTH_URL`, Google OAuth **redirect URIs**, Fly
  secrets, and `docs/DEPLOYMENT.md`. Coordinate with a deploy; verify TLS + sign-in
  end-to-end after cutover.

**Docs (lifecycle close — runs the `update-docs` skill, Mode A):**
- Update `OVERVIEW.md`, `README.md`, `AGENT-NOTES.md` to describe Rungs (multi-tenant,
  `/l/{slug}`, staff-only auth, new domain). Promote the `Promote: candidate` ADRs
  (ADR-011…015) per the skill, or explain deferral in CHANGELOG.

**Behaviours to verify (TDD order):**
1. App-shell metadata test: title/manifest/OG reflect "Rungs", not "Doubles Squash @ BSC".
2. Per-page title renders the resolved League's displayName + "Rungs".
3. (Manual, recorded not auto-tested) infra cutover checklist: TLS valid on
   `rungs.tomlinson.co.za`, Google sign-in works against the new redirect URI.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
Branding touches the shell/routes → re-run E2E (update any title/heading assertions).
Infra cutover is verified manually (record results in CHANGELOG).

## Completion
1. Update `CHANGELOG.md` (rebrand + infra cutover results + doc updates).
2. Mark step 24 complete in `RUNGS-PLAN.md`.
3. Commit `step-24: Rungs rebrand, infra rename & docs`.
4. Push `at-wip`. (Release to prod via `/create-pr` — manual merge to `main`.)
