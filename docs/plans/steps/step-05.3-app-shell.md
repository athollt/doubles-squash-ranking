# Step 05.3: App shell — global nav, sign-in/out, current user

## Objective
Add a persistent application shell (top navigation bar) to the root layout so
every page is reachable and shows auth state: app name, role-aware nav links,
and a sign-in / sign-out control with the current user.

## Why this step exists
The plan jumps from auth (04/05) to feature pages (06–12) with no global
navigation — pages are only reachable by typing URLs, and there is no way to
sign out or see who you are logged in as. This step adds the shell once so
every later page inherits it. **Visual styling is deliberately out of scope** —
plain shadcn/Tailwind defaults only; the palette, logo, and polish land at
step 13 (PWA & branding).

## Context
- Read `DECISIONS.md` ADR-004 (roles), ADR-006/007 (auth).
- Step 04/05.1 delivered auth: `auth()` reads the session server-side and the
  session exposes `role` (`ADMIN` | `SCORER` | undefined when logged out).
  `signIn`/`signOut` come from `@/auth` (server) and `next-auth/react` (client).
- Root layout today: `app/layout.tsx` renders `<body>{children}</body>` with no
  chrome. The `/signin` page exists (step 05.1); `/admin/players` exists
  (step 05). Public routes: `/`, `/sessions*`, `/players/*` (steps 09–11, mostly
  not built yet).
- Standing PLAN rule: this step touches a user-facing surface, so it ships E2E.

## Specification

### Nav component (`components/site-header.tsx` or similar)
- A Server Component that calls `auth()` to read the session (no client
  `SessionProvider` needed for display).
- **Always shown**: app name "Doubles Squash @ BSC" linking to `/` (the ladder).
- **Public links** (always): Ladder (`/`), Sessions (`/sessions`).
- **Authenticated links** (any signed-in user): Submit (`/submit`).
- **Admin-only links** (`role === "ADMIN"`): an Admin entry — at minimum
  Players (`/admin/players`); other admin routes (settings, sessions, users)
  added by their own steps as they land.
- **Auth control (right side)**:
  - Logged out → "Sign in" link to `/signin`.
  - Logged in → show the user's email (or name) and a "Sign out" button.
- The sign-out button is a small Client Component calling `signOut()` from
  `next-auth/react` (or a server action calling `signOut` from `@/auth`),
  returning to `/`.

### Wiring
- Render the header in `app/layout.tsx` above `{children}` so it is global.
- Links that point at not-yet-built routes (e.g. `/sessions`, `/submit`) are
  fine — they 404 until their step lands; the nav is forward-compatible.
- Do **not** restyle existing pages; only add the shell. Keep page-level
  `<main>` wrappers as they are.

### Styling constraint
- shadcn/Tailwind defaults only (e.g. a simple bordered top bar, flex row).
- No custom colours, logo, or theme — those are step 13. Use semantic tokens
  already in the project (`text-muted-foreground`, `border`, etc.).

**Behaviours to verify (TDD order):**

Unit (pure helper, if extracted): the set of nav links for a given role.
1. Logged-out nav shows public links + "Sign in", and NOT Submit/Admin.
2. Scorer nav shows public links + Submit + "Sign out", and NOT Admin.
3. Admin nav shows public links + Submit + Admin + "Sign out".

E2E (Playwright, ephemeral users from step 05.1):
4. On `/` while logged out: app name, Ladder, Sessions, and "Sign in" are
   visible; no "Sign out".
5. After signing in as admin: header shows the admin's identity, a "Sign out"
   control, and the Admin link; clicking Admin reaches `/admin/players`.
6. After signing in as scorer: header shows "Sign out" but NO Admin link.
7. Clicking "Sign out" returns to `/` and the header reverts to logged-out
   (Sign in visible again).

## Validation
```bash
npm run test
npm run build
npm run test:e2e
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step 05.3 complete in `PLAN.md`
3. Commit `step-05.3: app shell — global nav & auth control`
4. Push `at-wip`
