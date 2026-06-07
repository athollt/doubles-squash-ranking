# Step 16.1: UI rework (post-launch testing feedback)

## Objective
Apply the round of post-launch testing feedback that is pure UI/UX polish —
sign-in flow, header, public-page display, and admin card layouts — without
changing any behaviour, data model, or rating logic.

## Context
- Source feedback: this step is the first slice of the testing-feedback round
  captured after the step 14.4 live deploy. The submit-flow rework, the rating
  explainer, and the cleanup/security pass are split out into 16.2–16.4.
- Read first: `CHANGELOG.md` step 13.5 (redesign rollout — the shared shell,
  primitives, and `BottomNav` are already in place), `DECISIONS.md` ADR-006/007
  (Credentials provider lives only in `auth.ts`; the sign-in UI hides the
  credentials fields once Google works), and ADR-008 (design-system sequencing).
- The redesign already established the design system — every change here uses the
  existing primitives in `components/ui/` and the page shell. No new bespoke
  chrome, no new component families unless an existing primitive genuinely can't
  carry it.
- Relevant files: `app/signin/page.tsx`, `components/site-header.tsx`,
  `components/admin-menu.tsx`, `app/page.tsx` (ladder), `app/sessions/page.tsx`,
  `app/sessions/[id]/page.tsx`, `app/admin/sessions/page.tsx`,
  `app/admin/users/*`, `app/admin/players/*`.

## Specification

Behaviours, grouped by feedback area. Each is independently testable.

### A. Sign-in flow
1. **Top-right "Sign in" goes straight to Google.** Clicking the header
   "Sign in" control initiates the Google sign-in directly (no intermediate page
   for the common case). The email/password (Credentials) form moves to a
   separate, less-prominent sign-in screen — keep it reachable (it is the E2E
   fixture path per ADR-006), but it is no longer the default landing.
2. **Sign-in button gives immediate feedback.** The current button does not
   visibly respond on press though it works — add a pressed/pending state so the
   user sees the click register.

### B. Header
3. **Admin menu becomes a hamburger menu.** Convert the always-expanded
   `AdminMenu` into a hamburger/disclosure menu (collapsed by default, opens the
   admin links). Behaviour of the links is unchanged; only the trigger changes.
4. **Logged-in Google user shown as a profile avatar.** Replace the plaintext
   `session.user.email` in the header with a small circular avatar using the
   Google profile picture (`session.user.image`), falling back to an initial when
   no image is present. Email may remain as a title/tooltip.

### C. Public pages
5. **Drop the ladder strapline.** Remove the "Live doubles rankings · updated
   after every session" text from the ladder page.
6. **Session list shows player names inline.** On the public sessions list each
   session row lists the participating player names without needing to open the
   session. Games count is a nice-to-have — include it only if it fits the row
   cleanly.

### D. Admin layouts
7. **Admin → Players uses the same card layout as Admin → Users.** Re-skin the
   players admin screen to the per-item card layout already used for users.
8. **User card has an Edit button; Edit + Remove sit to the right.** Add an Edit
   action to the user card and right-align both Edit and Remove on the card.
9. **Admin → Sessions edit is a lighter-weight button.** Make the per-row Edit a
   lighter-coloured button (existing button variant — likely `outline`/`ghost` —
   not a new style).

### Constraints
- **Surgical:** no behaviour, route, mutation, or data-model change. This is
  presentation only. The Credentials provider stays exactly as ADR-006/007 define
  it.
- Reuse existing `components/ui/` primitives; do not introduce a new card/menu/
  avatar family if one already exists. If a primitive is genuinely missing (e.g.
  no avatar), add the smallest one that fits the design system.

**E2E (PLAN.md rule):** every touched user-facing route keeps its journey
covered. Update the existing Playwright specs to the new sign-in entry point,
header structure, and selectors rather than dropping coverage — the auth-flow,
ladder-view, and admin journeys must stay green. The Credentials E2E fixture path
must remain usable after the sign-in split.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
- Header "Sign in" lands on Google directly; credentials form reachable on its own
  screen and still works for the E2E fixture user.
- Sign-in button shows a pressed/pending state.
- Admin menu is collapsed by default and opens on tap.
- Logged-in header shows a profile avatar, not the raw email.
- Ladder strapline gone; session rows show player names.
- Admin Players renders as cards matching Admin Users; user cards have right-
  aligned Edit + Remove; admin Sessions Edit is the lighter variant.
- Manual phone check: each changed screen still feels like the app on a phone.

## Completion
1. Update `CHANGELOG.md` (note any nice-to-have, e.g. games count, that was
   deferred).
2. Mark step complete in `PLAN.md`.
3. Commit `step-16.1: ui rework`.
4. Push `at-wip`.
