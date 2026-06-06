# Architectural Decision Records

Append-only. ADRs capture *why*; code shows *what*. New entries at the bottom; supersede rather than amend.

---

## ADR-001: Full recalculation over incremental updates

**Date**: 2026-06-05
**Status**: accepted

**Context**: The rating algorithm must process all sessions chronologically to produce correct ratings (new/returning player multipliers depend on session count and gaps). At ~20 players and 1–3 sessions/week, full recalculation from scratch is computationally trivial.

**Decision**: Every session submit/edit/delete triggers a full recalculation from raw session data. No incremental update path.

**Consequence**: Simple, correct, and auditable. If scale grows 100×, revisit.

---

## ADR-002: current_ratings and ladder are computed, not stored

**Date**: 2026-06-05
**Status**: accepted

**Context**: The spec's `Current_Ratings` and `Ladder` tabs are derived views. Storing them adds a cache invalidation problem.

**Decision**: Derive current ratings and ladder order at request time from `ratings_log` + settings. No stored table for these.

**Consequence**: Every page load runs the aggregation. Acceptable at this scale (~200 ratings_log rows after a year). Add caching/materialisation later if needed.

---

## ADR-003: Reject invalid sessions at submission time

**Date**: 2026-06-05
**Status**: accepted

**Context**: The Google Sheets spec stored invalid sessions and flagged them. In a web app, rejecting bad input at the form is better UX.

**Decision**: Validate on submission. Invalid sessions are never stored. The user sees inline validation errors and corrects before submitting.

**Consequence**: No `Errors` tab equivalent needed. Simplifies the data model.

---

## ADR-004: Players are not linked to Google accounts

**Date**: 2026-06-05
**Status**: accepted

**Context**: Most players will never log in. Player identity is just a display name for the ladder. Auth is only for admins and scorers.

**Decision**: Separate `users` table (Google accounts + roles) from `players` table (name roster). No foreign key between them.

**Consequence**: A scorer who is also a player appears in both tables independently. Simple and correct for this use case.

---

## ADR-005: Out-of-repo symlinks excluded from Tailwind source detection

**Date**: 2026-06-05
**Status**: accepted

**Context**: The repo root contains `.claude` / `.devin` symlinks pointing outside the project. Tailwind v4's automatic content detection walked the root and followed them, crashing the Turbopack dev server (see CHANGELOG step 01.1). This ADR back-fills the reference made there.

**Decision**: Disable Tailwind automatic detection (`@import "tailwindcss" source(none)`) and declare explicit `@source` lines for `app`, `components`, `lib`.

**Consequence**: New top-level dirs holding class-bearing files need their own `@source` line. Documented as a maintenance note in CHANGELOG step 01.1.

---

## ADR-006: Credentials provider alongside Google for testability

**Date**: 2026-06-05
**Status**: accepted

**Context**: Step 04 specified Google OAuth as the only sign-in method, but the Google Cloud credentials do not yet exist (provisioned at deployment, step 14). This blocked all end-to-end verification of auth and the admin pages, and prevented local manual testing. Step 04's spec explicitly allowed manual/deferred E2E, but the gap left behaviour 8 (non-allowlisted account denied) unverified end-to-end.

**Decision**: Add an Auth.js Credentials provider (username/password against the `User` table, bcrypt hash in a nullable `passwordHash` column) **alongside** the Google provider. The provider lives only in the Node-runtime config (`auth.ts`), never the edge `auth.config.ts`, preserving the step-04 split. The existing allowlist/role callbacks are unchanged — they are provider-agnostic. Two seeded users (admin + test scorer) serve as E2E fixtures.

**Consequence**: The app can be signed into and fully E2E-tested without Google. Both providers coexist; once Google works (step 14), the credentials fields are hidden from the sign-in UI while the provider remains for E2E. The tradeoff is a password surface that must not be exposed in production — mitigated by hiding the UI and keeping seed passwords env-driven. Supersedes the "Google OAuth only" intent of step 04.

---

## ADR-007: Adopt the `proxy.ts` convention and collapse the split auth config

**Date**: 2026-06-05
**Status**: accepted (supersedes the split-config rationale of ADR-006 / step 04)

**Context**: Next.js 16 deprecates the root `middleware.ts` convention in favour of `proxy.ts` (the build emits a deprecation warning). The two are not identical: **`middleware.ts` runs in the Edge runtime; `proxy.ts` defaults to the Node.js runtime** (and forbids the `runtime` config option). 

Step 04 introduced a *split* auth config specifically to work around the Edge runtime: `auth.config.ts` (Prisma-free, Edge-safe, shared with the middleware) and `auth.ts` (full Node instance with the Prisma-backed callbacks + Credentials provider). The split existed *only* because the middleware ran on the Edge and could not load Prisma/bcrypt. Under `proxy.ts` running in Node, that constraint no longer exists.

The project has **no users yet** — the cheapest possible moment to correct foundational architecture.

**Decision**:
1. Rename `middleware.ts` → `proxy.ts`. The `config.matcher` export is unchanged; the Auth.js `auth(...)` wrapper remains the default export. 
2. Collapse the split: merge `auth.config.ts` back into `auth.ts` and build the single auth instance once. The proxy imports `auth` from `auth.ts`. The Edge-safety carve-outs (e.g. the duplicated `session` callback added in step 05.1) are removed — there is one config with all providers and callbacks.
3. The pure, provider-agnostic logic (`authorizeRoute`, `resolveSignIn`/`resolveJwt`/`resolveSession`/`verifyCredentials` in `lib/`) is unchanged — those are not coupled to the runtime and keep their unit tests.

**Consequence**: One auth config instead of two; no Edge/Node duplication to keep in sync (the step 05.1 bug — the Edge instance silently missing the `session` callback — becomes structurally impossible). The proxy now runs in Node, so it *may* touch Prisma directly if ever needed (it currently does not — it still only reads `role` off the signed JWT). Risk: the migration touches the core auth wiring, but the 11 Playwright E2E specs from step 05.1 cover the exact behaviour (redirects + role gating) and are the acceptance gate. If a future need arises for Edge middleware, this decision would have to be revisited (re-introducing a Prisma-free config).

---

## ADR-008: Host on Fly.io (Johannesburg) instead of Hetzner; accept deprecated unmanaged Postgres

**Date**: 2026-06-06
**Status**: accepted (supersedes the Hetzner/Cape Town hosting choice of RESEARCH-tech-stack.md §7)

**Context**: The plan (RESEARCH-tech-stack.md §7) specified **Hetzner Cloud CX22, Cape Town (ZA)**, chosen explicitly for low ZA latency and a same-box self-hosted Postgres. At provisioning time two premises proved false: (1) **Hetzner has no South Africa datacenter** — its only locations are EU (Falkenstein/Nuremberg/Helsinki), US (Ashburn/Hillsboro), and Singapore; the "Cape Town" fact was wrong from the start; (2) **CX22 was discontinued 2026-02-13**. Hetzner-EU is ~150–180ms from ZA users. A same-day comparison (`RESEARCH-flyio-vs-hetzner.md`) initially favoured Hetzner *because* "Fly's managed Postgres isn't in ZA (~150ms)" — but with no Hetzner ZA region, that penalty applies to Hetzner too. The only option that puts the app physically in South Africa is **Fly.io's `jnb` (Johannesburg)** region (~10–30ms to ZA users).

**Decision**:
1. **Host on Fly.io, primary region `jnb`.** App as an always-on single machine (`auto_stop_machines = "off"`, `min_machines_running = 1`) — no cold starts for the public ladder.
2. **Database: unmanaged Fly Postgres, also in `jnb`**, co-located with the app (~0ms app↔DB), attached via `fly postgres attach` (sets `DATABASE_URL`). Backups via Fly **volume snapshots** (daily, ~5-day retention); a `pg_dump`→object-storage cron is a deferred hardening option.
3. **Deploy via `flyctl deploy`** from GitHub Actions (`FLY_API_TOKEN` only); migrations run through `fly.toml`'s `release_command = "npx prisma migrate deploy"`. This removes the Dockerfile-only-via-GHCR, `docker-compose.prod.yml`, Caddy, and SSH-deploy machinery the Hetzner plan required. Runtime config lives in **Fly secrets**, not a VPS `.env`.

**Consequence**: Users get true in-SA latency — the property the original plan wanted but couldn't deliver on Hetzner. Deploy/TLS are simpler (`fly deploy`, `fly certs`, auto Let's Encrypt). Cost is modestly higher (~R240/mo vs Hetzner-EU ~R110) and there is **medium vendor lock-in** (fly.toml, Machines, flyctl). **Key accepted risk**: Fly has **deprecated and dropped support for unmanaged Postgres** — `fly postgres create` still works but ops/upgrades/DR are entirely ours, and Fly may remove it. Mitigation: it's a small club app; snapshots cover DR; if Fly retires unmanaged PG we migrate to an external managed Postgres (accepting the ~150ms hop) or revisit hosting. The supported alternative (Fly Managed Postgres) was rejected: not in `jnb` (~150ms) and $38/mo+, which defeats both the latency rationale and the budget. Revisit if Fly brings Managed Postgres to `jnb`. Supersedes ADR-nothing in code but overrides RESEARCH-tech-stack.md §7–§9 (hosting/CI/CD/future-proofing) and the step 14.2/14.4 Hetzner specs (rewritten).

---

## ADR-008: Identity-first, prototype-before-refactor sequencing for the redesign

**Date**: 2026-06-06
**Status**: accepted

**Context**: After step 13 the app worked but felt like a web page, not the mobile/PWA app it is meant to be, and the screens were visually inconsistent — every `page.tsx` hand-rolled its own shell/heading/width and defined local components (`StatusBadge`, `MovementIndicator`, `LadderCards` in `app/page.tsx`). The root cause is structural: no earlier step established shared UI primitives or a "reuse before you build" rule, so each feature page improvised. The obvious instinct — "add a refactor-for-consistency step at the end" — is a trap: extracting shared components *before* the look-and-feel and navigation model are decided produces primitives that get thrown away. The redesign covers two separable axes — **CI** (logo, palette, fonts) and **UX** (layout, navigation, interaction) — and the question was how to sequence them against the build.

**Decision**: Sequence the redesign as five steps, deciding before building, identity before structure:
1. **13.2 CI prototype** — a standalone `zTemp/` mood-board of 5 complete identities; lock the visual identity first.
2. **13.3 UX prototype** — in-app `?variant=` layouts for the two first-class phone journeys (ladder, submit), rendered *in the chosen CI* so feedback is about structure, not placeholder styling.
3. **13.4 design-system foundation** — build the shared primitives (page shell, card, badge, nav chrome) in the chosen identity. No feature page re-skinned.
4. **13.5 rollout** — re-implement every screen on those primitives. This is where consistency and the mobile-app feel actually land.
5. **13.6 skill-fixes** — retrofit `create-prd`/`create-plan` so a future plan mandates a design-system-first step + per-step reuse check (learn-then-retrofit, after living the redesign).

Deployment (14.4) depends on 13.5 so it ships the finished design. Prototype code is throwaway; the durable artifacts are `PROTOTYPE-NOTES-ci.md` and `PROTOTYPE-NOTES-ux.md`.

**Considered options**:
- *Refactor-for-consistency step at the end* — rejected: builds components before the design that defines them; guaranteed rework.
- *One combined redesign step* — rejected: too large to validate incrementally; conflates the CI decision, the UX decision, and the rollout.
- *UX-first, CI later* — rejected: layout variants would render in placeholder styling, and "ignore the colours" feedback is noisy. CI-first lets 13.3 be judged on structure alone.
- *Fix the skills up front* — rejected: would encode an unvalidated convention; 13.6 codifies what actually worked.

**Consequence**: The redesign is five tracked steps instead of one, with a clear decision→build boundary and no speculative component extraction. The cost is more plan ceremony and two prototype phases before any production code changes. The "refactor for consistency" work is reframed as 13.4 + 13.5 (implementation of a decided design), not an end-of-plan cleanup. The skill fix (13.6) makes the design-system-first convention the default for future features, so this inconsistency should not recur. A future reader asking "why is the redesign five steps / why CI before UX?" finds the answer here.
