# Step 13.3: Mobile-first prototype (ladder + submit)

## Objective
Answer the design question **"what does this feel like as a mobile app, not a web
page?"** before committing to a redesign. Produce a locked design direction
(navigation model + look-and-feel) for the **public ladder** and the **scorer's
Submit a Session** screens — the two first-class phone journeys.

This is the first of the four redesign steps (13.3 prototype → 13.4 design-system →
13.5 rollout → 13.6 skill-fixes). It decides; the later steps build.

## Context
- Replaces the former "Look & feel (scope TBD)" placeholder in this slot.
- Depends on **13.2**: render these UX variants in the CI identity chosen there (see
  its `PROTOTYPE-NOTES-ci.md`) — judge structure/navigation, not placeholder styling.
- The app is **PWA-first**: design for the installed phone experience, then back-port
  to the website. Both public-viewing and scorer-submission are first-class.
- Current state is the inconsistency this redesign fixes: every `page.tsx` hand-rolls
  its own `<main>` shell / `<h1>` / `max-w` (three different widths across three
  pages); `StatusBadge`, `MovementIndicator`, `LadderCards` are defined *locally* in
  `app/page.tsx`; `components/ui/` has only button/dialog/input/table — no card,
  badge, page-shell, or mobile nav chrome.
- The submit form (`components/session-form.tsx`) is a flat list of N `<select>` +
  number-input rows with "Add player slot" (up to 8). The doubles structure (two
  teams of two) is **not represented** — a prime target for the prototype.
- Uses the `/prototype` skill, **UI branch, sub-shape A (in-app)**:
  `docs/plans/` exists, so notes land here as `PROTOTYPE-NOTES-ux.md`.
- See `CONTEXT-redesign.md` for pinned terms (PWA-first, Redesign, design-system
  foundation, scorer-submission journey).

## Specification

Per the `/prototype` UI branch:

1. **Two routes get variants** (3 each, structurally different — not recolours):
   - **Ladder** (`/`) — explore information hierarchy and the app navigation model
     (e.g. bottom tab bar vs top chrome; card-first vs table; rank emphasis).
   - **Submit a Session** (`/submit`) — explore the *interaction model* for entering
     a doubles result on a phone courtside (e.g. team-structured cards vs stepper/
     wizard vs single dense form). At least one variant must represent the
     two-teams-of-two structure explicitly.
2. **In-app, gated by `?variant=`** — keep existing data fetching, auth, and routing
   above the switcher; only the rendered subtree swaps. Stub any writes (read-only
   prototype — no real session mutations).
3. **Floating switcher** — fixed bottom-centre pill: ←, current variant label, →;
   updates the URL param; `←`/`→` keys cycle (disabled when an input is focused);
   visually distinct so it's obviously not part of the design under evaluation.
4. **Clearly throwaway** — `prototype-` prefix / `*.prototype.*` naming.

**This step does NOT** build shared components, refactor other screens, or touch the
real submit mutation. Those are 13.4 / 13.5.

## Validation
- App runs (`npm run dev`); both routes render all three variants via `?variant=`.
- The floating switcher cycles variants by click and by arrow key; URL is
  reload-stable and shareable.
- No real session is created by the prototype (writes stubbed).
- `PROTOTYPE-NOTES-ux.md` written in `docs/plans/`, capturing: the question, the
  winning direction per screen (often "header from B, submit flow from C"), and the
  design decisions it locks in for 13.4/13.5.
- **All prototype code deleted** after the answer is captured (switcher, variant
  components, route gating). `PROTOTYPE-NOTES-ux.md` is the only durable artifact.

## Completion
1. Confirm the winning direction with the human before writing `PROTOTYPE-NOTES-ux.md`.
2. Delete all prototype code.
3. Update `CHANGELOG.md` (record the decision + that prototype code was removed).
4. Mark step complete in `PLAN.md`.
5. Commit `step-13.3: mobile-first prototype`.
6. Push `at-wip`.
