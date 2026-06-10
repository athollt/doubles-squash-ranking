# Step 25: Infra rename & domain cutover

## Objective
Rename the production infrastructure off "squash" and move the app to its own
domain, **rungs.co.za**. This step is deliberately separate from the rebrand
(step 24) because — unlike the cosmetic re-skin — it is **hard to reverse** and
touches things that cannot be verified locally: the **Fly.io** app + Postgres,
the **GitHub Actions** deploy workflow, Google OAuth redirect URIs, DNS/TLS, and
the live `AUTH_URL`. Do this last, with a deploy, after step 24 has shipped.

## Context
- Read first: `DECISIONS.md` **ADR-008** (Fly hosting), **ADR-013** (single shared
  PWA identity); `docs/DEPLOYMENT.md` + `docs/deployment/02-fly.md` (current infra:
  app `bsc-squash-ladder`, Postgres `bsc-squash-db`, region `jnb`, domain
  `squash.tomlinson.co.za`).
- Depends on step 24 (the in-app rebrand must already be merged so the deployed app
  reads "Rungs" before the domain says so).
- **New domain: `rungs.co.za`** — the owner sets up the CNAME (→ the renamed Fly
  app's `*.fly.dev`) out-of-band; this step coordinates the app/secret/OAuth side of
  the cutover with that DNS change.

## Current → target (the rename map)
| Thing | Current | Target |
|---|---|---|
| Fly app | `bsc-squash-ladder` | `rungs` (or `rungs-app`) |
| Fly Postgres | `bsc-squash-db` | `rungs-db` |
| Public origin | `https://squash.tomlinson.co.za` | `https://rungs.co.za` |
| `fly.toml` `app =` | `bsc-squash-ladder` | the new app name |
| `AUTH_URL` secret | `https://squash.tomlinson.co.za` | `https://rungs.co.za` |
| `metadataBase` fallback (`app/layout.tsx`) | `https://squash.tomlinson.co.za` | `https://rungs.co.za` |
| `.env.example` comment | `squash.tomlinson.co.za` | `rungs.co.za` |
| Google OAuth redirect URI | `…/api/auth/callback/google` on old origin | same path on `rungs.co.za` |

> Fly apps can't be renamed in place — plan to **create the new app** (and DB), set
> its secrets, deploy, cut DNS over, then destroy the old app once verified. Keep the
> old app running until TLS + sign-in are green on the new domain (rollback path).

## Specification (manual/ops — record results in CHANGELOG)
1. **DNS prerequisite (owner):** `rungs.co.za` CNAME → the new Fly app's `*.fly.dev`.
2. **Fly:** create the new app + unmanaged Postgres in `jnb`; attach the DB
   (`DATABASE_URL` secret). Set `AUTH_URL=https://rungs.co.za`, re-set `AUTH_SECRET`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Migrate prod data per the backup-gated
   runbook (snapshot first — ADR-008 / step 17).
3. **`fly.toml`:** update `app =` to the new name (the one code change in this step).
4. **GitHub Actions (`.github/workflows/fly-deploy.yml`):** confirm it deploys the new
   app (the `FLY_API_TOKEN` secret must scope to it; `flyctl deploy` reads `fly.toml`'s
   app). Update the token/secret if the new app needs a fresh deploy token.
5. **Code domain refs:** `app/layout.tsx` `metadataBase` fallback + `.env.example`
   comment → `rungs.co.za`.
6. **Google Cloud:** add the `rungs.co.za` authorized redirect URI (and JS origin);
   keep the old one until cutover is verified, then remove.
7. **Docs:** update `docs/DEPLOYMENT.md` + `docs/deployment/02-fly.md` with the new app,
   DB, domain, and CNAME.
8. **TLS:** issue the Let's Encrypt cert for `rungs.co.za` via Fly; verify auto-renew.

## Behaviours to verify (manual — recorded, not auto-tested)
1. `https://rungs.co.za` serves the app over valid TLS.
2. Google sign-in works end-to-end against the `rungs.co.za` redirect URI.
3. The public league ladder + WhatsApp share links resolve on the new origin
   (slug immutability — ADR-013 — keeps `/l/{slug}` paths stable across the domain move).
4. A GitHub Actions push deploys to the renamed Fly app.
5. The old app/domain can be retired with no broken links (or a redirect is left in place).

## Validation
```bash
npm run build && npm run test
```
The only code changes are `fly.toml`'s `app =` and the two domain-string refs, so the
local gate is build + unit. Everything else is verified **manually on the live cutover**
and recorded in CHANGELOG. (No route/behaviour change → no new E2E.)

## Completion
1. Update `CHANGELOG.md` (rename map applied + cutover verification results).
2. Mark step 25 complete in `RUNGS-PLAN.md`.
3. Commit `step-25: infra rename & rungs.co.za cutover`.
4. Push `at-wip`. (Release to prod via `/create-pr` — manual merge to `main`.)
