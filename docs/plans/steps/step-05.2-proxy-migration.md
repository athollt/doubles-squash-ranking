# Step 05.2: Migrate to `proxy.ts` & collapse the split auth config

## Objective
Replace the deprecated `middleware.ts` convention with `proxy.ts` (Node
runtime) and, because the Edge constraint that forced it is gone, collapse the
split auth config (`auth.config.ts` + `auth.ts`) into a single config.

## Context
- Read `DECISIONS.md` **ADR-007** (this change) and ADR-006 (the split it supersedes).
- Next.js 16 deprecates root `middleware.ts` → `proxy.ts`. Key difference:
  `proxy.ts` defaults to the **Node.js runtime**, not Edge.
- Step 04 created the split config solely to keep Prisma out of the Edge
  middleware. Under Node, that reason no longer applies.
- Step 05.1 delivered **11 Playwright E2E specs** covering auth redirects + role
  gating — these are the acceptance gate for this refactor.
- Step 05.1 also revealed (and fixed) a bug where the Edge instance silently
  lacked the `session` callback. Collapsing the config makes that class of bug
  structurally impossible.

## Specification

1. **Rename** `middleware.ts` → `proxy.ts`. Keep the `auth((req) => …)` wrapper
   as the default export and the `config.matcher` export unchanged.
2. **Collapse the config**: merge the contents of `auth.config.ts` into `auth.ts`
   so there is a single `NextAuth({...})` call with all providers (Google +
   Credentials) and all callbacks (`signIn`, `jwt`, `session`). Delete
   `auth.config.ts`. The proxy imports `auth` from `@/auth`.
3. **Remove the Edge carve-outs**: the duplicated `session` callback that step
   05.1 added to `auth.config.ts` is no longer needed once there is one config.
4. **Do not change** the pure logic in `lib/` (`auth-rules`, `auth-callbacks`,
   `password`) or any unit test — they are runtime-agnostic.
5. Confirm the production **build emits no deprecation warning** and no Edge
   runtime warnings.

## Behaviours to verify
This is a refactor with existing coverage, not new behaviour. The acceptance
gate is that **all step 05.1 behaviours still hold** through the new file/config:
1. Unit suite unchanged and green.
2. `npm run build` — clean, **no `middleware`-deprecation warning**.
3. All 11 E2E specs still pass (public pages, unauthenticated redirects,
   non-allowlisted denied, scorer→/unauthorised, admin→/admin/players, player CRUD).

If any E2E fails, the refactor changed behaviour — fix before proceeding.

## Validation
```bash
npm run test
npm run build
npm run test:e2e
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step 05.2 complete in `PLAN.md`
3. Commit `step-05.2: migrate to proxy.ts & collapse split auth config`
4. Push `at-wip`
