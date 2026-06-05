# Step 04: Authentication & authorisation

## Objective
Implement Google Sign-In with Auth.js v5, role-based route protection, and the unauthorised page.

## Context
- Step 02 delivered: User model with email/role.
- See RESEARCH-tech-stack.md §2 for Auth.js v5 implementation details.
- See DECISIONS.md ADR-004 (players not linked to users).
- See PRD § Authentication & Authorisation.

## Specification

### Auth.js v5 setup
1. Install `next-auth@beta` (v5) and `@auth/prisma-adapter` (for user lookup only — sessions are JWT, not DB).
2. Configure Google OAuth provider.
3. `signIn` callback: query `User` table by email. If not found → redirect to `/unauthorised`. If found → allow.
4. `jwt` callback: attach `role` from User table to the JWT token.
5. `session` callback: expose `role` on the session object.

### Middleware (`middleware.ts`)
- Public routes (no auth): `/`, `/sessions`, `/sessions/[id]`, `/players/[id]`, `/unauthorised`, `/api/auth/*`, static assets.
- Scorer+ routes (require auth): `/submit`, `/sessions/[id]/edit`.
- Admin routes (require auth + admin role): `/admin/*`.
- Unauthenticated access to protected routes → redirect to Google Sign-In.
- Authenticated but wrong role → redirect to `/unauthorised`.

### Pages
- `/unauthorised` — simple page saying "Your Google account does not have access. Contact the admin."
- Sign-in uses Auth.js default pages (no custom sign-in page needed for v1).

### Environment variables
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_URL` (or `NEXTAUTH_*` equivalents depending on v5 naming).

**Behaviours to verify (TDD order):**
1. Unauthenticated request to `/submit` redirects to sign-in.
2. Unauthenticated request to `/admin/players` redirects to sign-in.
3. Unauthenticated request to `/` succeeds (200).
4. Unauthenticated request to `/sessions` succeeds (200).
5. Authenticated scorer can access `/submit`.
6. Authenticated scorer cannot access `/admin/players` (redirected to `/unauthorised`).
7. Authenticated admin can access `/admin/players`.
8. Google account not in User table is denied at sign-in (redirected to `/unauthorised`).
9. JWT token contains the correct role after sign-in.

Note: Auth tests will use mocked sessions (Vitest) and real Google OAuth flow (Playwright E2E, if feasible with test accounts — otherwise manual verification documented).

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-04: authentication & authorisation`
4. Push `at-wip`
