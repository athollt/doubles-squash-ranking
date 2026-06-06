# Step 14.1: Google Cloud OAuth setup (manual)

## Objective
Create a Google OAuth client and verify real Google sign-in **locally** (against
`localhost:3001`) before any production server exists. Produces `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET`.

## Type
**Manual runbook** — no code change. Follow the step-by-step guide; this step file is
the plan-level tracker.

## Runbook
→ [docs/deployment/01-google-oauth.md](../../deployment/01-google-oauth.md)

## Context
- The Google provider is already wired in `auth.ts` (steps 04 / 05.2); only credentials
  are missing. The Credentials provider (ADR-006) stays for E2E.
- RESEARCH §2 (auth, gotchas), §10 (Google Cloud project under atholl@tomlinson.co.za).
- `.env` uses Auth.js v5 names: `AUTH_URL`, `AUTH_SECRET` (the RESEARCH `NEXTAUTH_*`
  names are the old aliases — use `AUTH_*`).

## Completion (acceptance)
- OAuth client created with **both** redirect URIs registered (`localhost:3001` +
  `squash.tomlinson.co.za`), path `/api/auth/callback/google`.
- **Local proof**: signing in with Google as `atholl@tomlinson.co.za` at
  `http://localhost:3001/signin` lands signed-in with Admin ▾ visible; a
  non-allowlisted account is redirected to `/unauthorised`.
- Credentials recorded for use in 14.2 (VPS `.env`) and 14.3 (GitHub Secrets).

Production-domain verification is deferred to **14.4**.

> No app code or tests change in this step — nothing to commit beyond plan/changelog
> housekeeping. Record completion in `CHANGELOG.md` and mark the step complete.
