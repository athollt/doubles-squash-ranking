# Step 13.6: Fix create-prd & create-plan skills

## Objective
Close the process gap that caused the cross-screen inconsistency (your Q1: *"why
didn't this happen initially?"*). Retrofit **both** the `create-prd` and `create-plan`
skills so a future plan establishes shared UI primitives up front and reuses them per
step — driven by the lessons actually learned in 13.3–13.5, not guessed.

## Context
- Depends on **13.5**: we fix the skills *after* living the redesign, so the
  convention we encode is the one that proved out (chosen timing — "add as a plan
  step", learn-then-retrofit).
- Root cause: no skill required a design-system-first step or a per-step "reuse before
  you build" check, so every feature page hand-rolled its own chrome.
- The skills live at `.claude/skills/create-prd/SKILL.md` and
  `.claude/skills/create-plan/SKILL.md`.
- `create-plan` already has the symmetric convention at §3 ("**Always append a final
  `step-NN-update-docs.md`**") — the design-system step is the front-bookend to that
  back-bookend. Mirror its phrasing.

## Specification

1. **`create-prd`** — add a **Design / UX** capture to the PRD template + process:
   - Mobile-vs-web intent (the PWA-first vs responsive-web distinction).
   - Look-and-feel / CI direction and a component inventory the plan can inherit.
   - So design intent is explicit up front, not discovered after pages are built.

2. **`create-plan`** — two additions, mirroring the existing update-docs convention:
   - **Design-system-first step**: when the PRD has UI scope, the plan must include an
     early step that establishes shared primitives (page shell, card, badge, nav
     chrome) *before* feature pages — analogous to the mandatory final update-docs
     step.
   - **Per-step reuse check**: the Execution Protocol gains a "reuse existing
     components before building new ones" check, so feature steps consume the
     design-system rather than re-rolling chrome.

3. Keep edits **surgical and validated against the real skill text** — match each
   skill's existing structure and phrasing; no drive-by rewrites.

**Source of truth:** the convention encoded must reflect what 13.3–13.5 actually did
(prototype → design-system foundation → reuse on rollout). Cite the redesign as the
worked example.

## Validation
- Both `SKILL.md` files updated; diffs limited to the design-system convention +
  Design/UX capture (no unrelated edits).
- Re-read each skill end-to-end: the new convention reads consistently with the
  existing process (especially `create-plan` §3 update-docs symmetry).
- A dry mental run: "given the squash PRD, would create-plan now produce a
  design-system step before the feature pages?" → yes.

## Completion
1. Update `CHANGELOG.md`.
2. Mark step complete in `PLAN.md`.
3. Commit `step-13.6: fix create-prd & create-plan skills`.
4. Push `at-wip`.
