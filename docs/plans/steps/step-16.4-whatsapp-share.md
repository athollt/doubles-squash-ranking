# Step 16.4: WhatsApp share on session submit (Web Share API)

## Objective
After a scorer successfully submits a **new** session, let them post the result
to the club WhatsApp group with one tap — via the OS share sheet — without any
WhatsApp Business account, per-message fee, or new infrastructure.

## Context
- Read first: `RESEARCH-whatsapp-notifications.md` (verdict + the four directions
  it ruled out) and `CHANGELOG.md` step 16.2 (the two-phase submit flow).
- **Why this design, not the API:** the research found the official Cloud API
  cannot post to a normal club group (the new Groups API caps at 8 participants),
  `wa.me` pre-fill is 1:1 only, and unofficial bridges are a ToS violation with a
  2–8-week account-ban lifespan. The only zero-cost, ToS-clean path that reaches a
  group is `navigator.share` — the user picks the group in the OS share sheet.
- Current submit path: `app/submit/page.tsx` → `SessionForm` (`components/session-form.tsx`).
  On success the form does `router.push("/")` immediately
  (`session-form.tsx:119`). The server action `submitSessionAction`
  (`app/submit/actions.ts`) already returns `{ ok: true, sessionId }`, but the
  form's `onSubmit` prop type (`SessionFormResult`) narrows it to `{ ok: true }`
  and discards the id.
- The form already holds, client-side, the chosen player **names** and **wins**
  per entry (the chip-picker `entries` state) — enough to build the result text
  without a re-fetch.
- The public ladder lives at the site root (e.g. `squash.tomlinson.co.za`).

## Decisions baked into this step (from grilling)
- **Trigger:** a **success screen on `/submit`** — after a new submit, instead of
  redirecting, show a brief "Session logged ✓" confirmation with a **Share to
  WhatsApp** button and a **View ladder →** link. Sharing must run inside a user
  gesture, so the button guarantees one.
- **Feature detection, no fallback:** only show the success/share screen when
  `navigator.share` is available (Android/Chrome, iOS Safari). When it is **not**
  available (most desktop browsers), behaviour is **unchanged** — redirect straight
  to `/` as today. No clipboard or `wa.me` fallback.
- **Message content:** plain-text **summary + ladder link** — session date, each
  player and games won, then the public ladder URL. No rating-movement computation.
- **New submit only:** the edit flow (`app/sessions/[id]/edit`) is **unchanged** —
  it keeps redirecting to `/` on save. The share screen is for the
  "results are in" moment only.

## Specification

**Behaviours to verify (TDD order):**

1. **Share text builder (pure function).** A helper takes the submitted roster
   (player display names + wins) + a ladder URL and returns the share text, e.g.:
   ```
   Doubles @ BSC — 7 Jun

   Alice 3, Bob 2, Carol 2, Dave 1

   Ladder: <ladder url>
   ```
   Unit-test it directly: ordering, the date, names with wins, and the trailing
   link. Keep it framework-free so it's trivially testable.
2. **Surface `sessionId`/roster to the client.** Widen the submit `onSubmit`
   result so the form receives what it needs to build the message (the roster is
   already in client state; the ladder URL is a constant/env). Do **not** change
   the server action's behaviour or the edit-mode contract.
3. **Success screen on supported devices.** On a successful **new** submit, when
   `navigator.share` exists, the form renders the success screen (confirmation +
   "Share to WhatsApp" + "View ladder") instead of redirecting.
4. **Share invokes `navigator.share`.** Tapping "Share to WhatsApp" calls
   `navigator.share({ text })` with the built text. (The OS sheet then lets the
   user pick the club group — not driveable/assertable in test; assert the call
   and its payload.) "View ladder" navigates to `/`.
5. **Unsupported devices unchanged.** When `navigator.share` is absent, a
   successful new submit redirects to `/` exactly as before — no success screen.
6. **Edit mode unchanged.** Editing a session still redirects to `/` on save; the
   share screen never appears there.

## Constraints
- **Surgical:** the server action, validation, and rating recalculation are
  untouched. This adds a client success/share screen and a pure text helper; it
  must not change the submitted payload or the edit-mode contract (`Props`,
  `FormSlot`, `onSubmit`/`onDelete` stay stable per step 16.2).
- No new runtime dependency. `navigator.share` is a browser API — feature-detect,
  don't polyfill.
- No WhatsApp Business account, BSP, env credentials, or hosting added. The ladder
  URL is the only new config value (reuse an existing public-base-URL constant/env
  if one exists; otherwise a small constant).
- Guard SSR: `navigator` is client-only — detection runs in the client component,
  never during render on the server.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
```
- Unit: the share-text builder returns the expected string for a sample roster.
- Unit/component: with `navigator.share` mocked present, a successful new submit
  shows the success screen and the Share button calls `navigator.share` with the
  built text; with it absent, submit redirects to `/`.
- E2E (PLAN.md rule — `/submit` is a user-facing route): the new-session journey
  stays green; assert the success screen appears (in a share-capable context) and
  the share control is present and wired. The native share sheet itself can't be
  driven in Playwright — assert up to the `navigator.share` call (stub it). The
  edit journey stays green and shows **no** share screen.
- Manual phone check: submit a session on an Android phone, tap "Share to
  WhatsApp", confirm the club group is selectable in the share sheet and the
  message reads correctly.

## Completion
1. Update `CHANGELOG.md`.
2. Add a `DECISIONS.md` entry: "WhatsApp results via Web Share API tap-to-share
   (no Business API / no bridge)" with the research doc as rationale.
3. Mark step complete in `PLAN.md`.
4. Commit `step-16.4: whatsapp share on submit`.
5. Push `at-wip`.
