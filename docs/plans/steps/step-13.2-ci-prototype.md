# Step 13.2: CI prototype (logo, colours, fonts)

## Objective
Answer the design question **"what is this app's visual identity?"** — explore the
corporate identity (logo, colour palette, typography) from scratch and lock one
direction *before* the UX prototype (13.3), so 13.3's layout variants render in the
chosen identity rather than in placeholder styling.

First of the redesign steps: **13.2 CI → 13.3 UX prototype → 13.4 design-system →
13.5 rollout → 13.6 skill-fixes.**

## Context
- Step 13 shipped a CI **baseline** now fully in play for replacement: `icon.svg` /
  `logo.svg` / `og.svg` (racket + ball mark), charcoal `#1A1A1A` + electric blue
  `#2D7FF9` palette (theme vars in `app/globals.css`), Geist Sans + Geist Mono fonts
  (`app/layout.tsx`). **All three — logo, palette, fonts — are open to redesign.**
- Uses the `/prototype` skill, **UI branch, sub-shape B (standalone)**: a self-
  contained style-tile / mood-board, not the real app. Identity is judged on
  specimens, not live screens — fidelity to real content is deferred to 13.3.
- Lives in `zTemp/ci-prototype/` (standalone; no app build dependency).
- See `CONTEXT-redesign.md` for pinned terms.

## Specification

Per the `/prototype` UI branch, applied to identity rather than layout:

1. **5 complete CI directions** — each a full identity: a logo/mark treatment, a
   colour palette (with hex), and a font pairing (heading + body). Five is the
   `/prototype` skill's stated ceiling ("more than 5 stops being radically
   different") — a deliberate within-bounds choice, **do not trim to the default 3**.
2. **Radically different** — distinct identity per direction (e.g. bold-sporty vs
   minimal-editorial vs retro-club vs high-contrast-dark vs playful), not five tints
   of the same palette.
3. **Style-tile per direction** — each shows: the mark, the palette swatches, the
   type specimen (headings + body + numerals, since the ladder is number-heavy), and
   a small sample component (e.g. a ranked row) so the identity is seen on
   representative content.
4. **Switcher** — flip between the 5 directions (e.g. `?ci=` param or simple tabs);
   high-contrast, obviously not part of any direction under evaluation.
5. **Clearly throwaway** — lives in `zTemp/ci-prototype/`, `prototype-`/`.prototype.`
   naming.

**This step does NOT** apply the CI to the real app, build components, or touch
`app/globals.css` / `app/layout.tsx`. That happens in 13.4/13.5 once 13.3's UX winner
is also known.

## Validation
- The mood-board runs with one command; all 5 directions are viewable and switchable.
- Each direction is a *complete* identity (logo + palette + fonts), not a partial.
- `PROTOTYPE-NOTES-ci.md` (in `docs/plans/`) captures: the question, the winning CI
  direction (or the hybrid — "logo from C, palette from A, fonts from D"), exact hex +
  font names, and that it feeds 13.3.
- `zTemp/ci-prototype/` is noted as cleanup-able (standalone — not deleted from a
  submodule, just flagged).

## Completion
1. Confirm the winning CI direction with the human before writing `PROTOTYPE-NOTES-ci.md`.
2. Update `CHANGELOG.md` (record the chosen identity; note `zTemp/` is disposable).
3. Mark step complete in `PLAN.md`.
4. Commit `step-13.2: CI prototype` (commits the notes + plan/changelog; `zTemp/` is
   gitignored).
5. Push `at-wip`.
