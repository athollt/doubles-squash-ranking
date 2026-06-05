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

## ADR-005: AGENTS.md and CLAUDE.md are symlinks — do not overwrite

**Date**: 2026-06-05
**Status**: accepted

**Context**: `create-next-app` (Next.js 16+) generates `AGENTS.md` and `CLAUDE.md` in the project root by default. In this repo those files are symlinks pointing to the shared LifeStack agent rules at `diffdev/agent-tools/AGENTS.md`. During the step-01 scaffold, the generated regular files conflicted with the symlinks during a git rebase, requiring manual resolution.

The generated `AGENTS.md` contained important Next.js-specific agent guidance:
```
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ
from your training data. Read the relevant guide in node_modules/next/dist/docs/ before
writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
```

**Decision**:
1. `AGENTS.md` and `CLAUDE.md` remain symlinks to the shared LifeStack rules. Do not replace them with regular files.
2. When scaffolding or upgrading Next.js, always exclude these two files from any copy/rsync operation.
3. Agents working on this repo **must** read `node_modules/next/dist/docs/` before writing any Next.js code — treat this as a standing rule equivalent to the generated file's instruction.

**Consequence**: The Next.js agent guidance is not in a file on disk, but is captured here and must be followed manually. Any agent starting a step should check `node_modules/next/dist/docs/01-app/` for breaking changes before writing framework code.
