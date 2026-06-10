# Deployment Runbook 01 — Google Cloud OAuth setup

**Step**: 14.1 · **Owner**: you (manual) · **Gates**: 14.4 (deployment)
**Goal**: create a Google OAuth client so Admins/Scorers can sign in with Google, and
prove it works against `localhost` *before* any server exists.

This runbook produces two secrets used later by [03-github-actions.md](03-github-actions.md)
and the VPS `.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

> Why local-first: a Google OAuth client may list **multiple** authorised redirect
> URIs. Register both `localhost` and the production domain on the *same* client, test
> the real Google flow locally now (de-risking the fiddliest part of deployment), then
> the production-domain proof becomes step 14.4's completion check. The app already has
> the Google provider wired (`auth.ts`); the only thing missing is the credentials.

---

## Prerequisites

- A Google account: **atholl@tomlinson.co.za** (the Google Cloud project owner — RESEARCH §10).
- Local app running: `docker compose up -d postgres`, then `npm run dev` (serves on **:3001**).
- The seeded admin exists locally with that email (`prisma db seed`).

> **`tomlinson.co.za` is a Google Workspace domain.** That means project creation is
> governed by Workspace, not just Cloud IAM — see the gotcha in step 1.

---

## Steps

### 1. Create a Google Cloud project
1. Go to <https://console.cloud.google.com/> signed in as **atholl@tomlinson.co.za**.
2. Project picker → **New Project**. Name it e.g. `bsc-squash-ladder`. Create.
3. Select the new project in the picker.

> **Workspace gotcha — "Google Cloud Platform service has been disabled".** On a
> Workspace domain the *Google Cloud Platform* service is **OFF for users by default**,
> so project creation fails with that error even though you have the rights. Fix it in
> the **Workspace Admin console** (not the Cloud console):
> 1. As a **Super Admin**, open <https://admin.google.com>.
> 2. **Apps → Additional Google services** (a.k.a. *Additional services without an
>    individual control*).
> 3. Find **Google Cloud Platform** → turn it **ON for everyone** (or your org unit). Save.
> 4. Wait a few minutes, return to the Cloud console, and **Retry** the project creation.
>
> Google will also auto-create a Cloud **Organization** (`tomlinson.co.za`) the first
> time — expected; the project lands under it. If you are not a Workspace Super Admin,
> whoever manages the domain must flip this toggle (it can't be granted from the Cloud
> side).

> **Workspace gotcha #2 — "service has been disabled" persists even with GCP "ON for
> everyone", an active billing account, and you as Org Admin. ROOT CAUSE: a missing IAM
> role.** The error message is misleading. The real cause (confirmed via the "No
> organization" attempt, which surfaced the true error) is:
> **`You do not have the required "resourcemanager.projects.create" permission`.**
>
> **Organization Administrator does NOT include `projects.create`** — it lets you
> *manage* IAM, not create projects. The org's *default* Project Creator grant is on the
> `tomlinson.co.za` org principal, not on your user. Fix:
> 1. Cloud console → **IAM & Admin → IAM**, resource picker = the **organization**
>    `tomlinson.co.za` (header: *"Permissions for organization …"*).
> 2. Edit principal **`atholl@tomlinson.co.za`** → **Add another role → Project
>    Creator** (`roles/resourcemanager.projectCreator`), **Condition: None**. Save.
> 3. **Sign out and back in** (a plain page refresh keeps the stale permission cache);
>    wait ~2 min for propagation.
> 4. Retry **New Project** under the org `tomlinson.co.za`. (Managed/Workspace accounts
>    **cannot** create "No organization" projects — they must create under the org.)
>
> Notes: the **Age-based access** restriction (GCP blocked for under-18 users) only
> exists on **Workspace for Education** tenants, not standard Workspace — it does not
> apply here. The earlier "GCP service ON" toggle (gotcha #1) is still a real
> prerequisite; this gotcha is the *second*, separate gate.

### 2. Configure the OAuth consent screen
1. **APIs & Services → OAuth consent screen**.
2. User type: **External**. Create.
3. App information:
   - App name: `BSC Doubles Squash Ladder`
   - User support email: `atholl@tomlinson.co.za`
   - Developer contact email: `atholl@tomlinson.co.za`
4. **Authorised domains**: add `tomlinson.co.za` (required so the production redirect
   URI on the subdomain is accepted — RESEARCH §2 gotcha 4).
5. Scopes: the defaults (`openid`, `email`, `profile`) are enough — no extra scopes. Save.
6. **Test users**: while the app is in *Testing* status, only listed accounts can sign
   in (max 100). Add **every email that must log in** before go-live — at minimum
   `atholl@tomlinson.co.za`, plus each Scorer's address. **Scorers on personal Gmail /
   non-`tomlinson.co.za` domains must each be added here.** They'll see an "unverified
   app" warning to click through — fine for a known, small userbase.
   > Leave the app in **Testing**. Do **not** Publish/submit for Google verification:
   > the app's own `users`-table allowlist is the real access gate, and publishing only
   > matters if you want sign-in *without* pre-listing each person — which you don't.

### 3. Create the OAuth client
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**. Name: `squash-web`.
3. **Authorised redirect URIs** — add:
   - `http://localhost:3001/api/auth/callback/google`  ← local testing (note port 3001)
   - `https://app.rungs.co.za/api/auth/callback/google`  ← production (Rungs cutover, step 25)
   - also add the **JavaScript origin** `https://app.rungs.co.za`
   > The path is fixed by Auth.js: `/api/auth/callback/google`. It must match exactly.
   > (Pre-cutover this was `https://squash.tomlinson.co.za/...`.)
4. Create. Copy the **Client ID** and **Client secret** — store them securely (you'll
   paste them into the VPS `.env` and GitHub Secrets later).

### 4. Verify locally (the real Google flow)
1. Put the credentials in your local `.env` (gitignored):
   ```bash
   GOOGLE_CLIENT_ID=<client id>
   GOOGLE_CLIENT_SECRET=<client secret>
   AUTH_URL=http://localhost:3001
   ```
2. Restart `npm run dev`.
3. Visit <http://localhost:3001/signin> → click **Sign in with Google**.
4. Sign in as `atholl@tomlinson.co.za`.

**Pass criteria:**
- ✅ You are redirected back and land signed-in (not `/unauthorised`).
- ✅ The header shows your email + Sign out, and **Admin ▾** appears (role attached
  from the `users` table via the `signIn`/`jwt`/`session` callbacks).
- ✅ A non-allowlisted Google account (one not in the `users` table) is sent to
  `/unauthorised` — confirms the allowlist gate.

If sign-in fails: check the redirect URI matches exactly (port 3001, `https`/`http`),
`AUTH_URL` matches the origin you're visiting, and the account is a listed test user.

---

## Outputs (carry forward)

| Value | Used in |
|---|---|
| `GOOGLE_CLIENT_ID` | VPS `.env`, GitHub Secret (14.3) |
| `GOOGLE_CLIENT_SECRET` | VPS `.env`, GitHub Secret (14.3) |

Production-domain verification happens in **14.4** once DNS + Fly TLS (`fly certs`,
auto Let's Encrypt) are live.
