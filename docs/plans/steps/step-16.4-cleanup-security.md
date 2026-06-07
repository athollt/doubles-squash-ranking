# Step 16.4: Cleanup & security review (public-repo readiness)

## Objective
Make a defensible "is this safe to be a public repo?" pass: remove dead code,
run an automated security review, confirm no secrets are committed, and document
the findings.

## Context
- This is the explicit "split into a separate step" item from the testing
  feedback. Runs after the UI work (16.1–16.3) so the audit reflects the final
  code.
- Read first: `DECISIONS.md` ADR-006/007 (the Credentials provider is a known
  password surface — the mitigation is hiding the UI + env-driven seed passwords;
  the audit must confirm that mitigation holds and no seed password is hard-coded)
  and ADR-008 (Fly secrets, not a committed `.env`).
- The repo is public. Auth wiring lives in `auth.ts`, `proxy.ts`, `lib/auth-*`;
  secrets are expected only in env / Fly secrets, never in the tree.

## Specification

This step is a verifiable audit, not a feature. Each item produces evidence
recorded in `CHANGELOG.md`.

1. **Automated security review.** Run the `/security-review` skill over the
   current branch. Triage every finding: fix the real ones in this step; for
   anything deferred, record why in `CHANGELOG.md`.
2. **Secret scan.** Confirm no secrets are committed — scan the working tree and
   history for credentials, tokens, keys, and a real `.env`. Verify `.env*`,
   `*.pem`, `*.key` are git-ignored and absent from the tree. Confirm seed
   passwords are env-driven (ADR-006), not literals in `prisma/seed.*` or tests.
3. **Public-repo posture.** Confirm nothing in the tree assumes privacy:
   no internal hostnames/URLs that shouldn't be public, no committed infra
   secrets (Fly tokens, GitHub Actions secrets live in CI secret store per
   ADR-008, not the repo), README/docs safe for public view.
4. **Dead-code removal.** Remove code made unused — start with anything the
   16.1–16.3 changes orphaned (e.g. components/styles replaced during the UI
   rework), then any clearly-unused exports surfaced by the linter/`tsc`. Per
   AGENTS.md §4: remove only what is genuinely unused; mention—do not delete—dead
   code that predates and is unrelated to this round (record it in `CHANGELOG.md`
   as a note).
5. **Housekeeping.** Any low-risk tidy that falls out of the above (lint clean,
   no `console.log` left in app code, no `// TODO: remove` leftovers).

## Constraints
- **Surgical & honest:** fixes here trace to a finding. If a security finding is
  out of scope to fix safely in this step, say so explicitly rather than papering
  over it. Do not silently rewrite history; if a committed secret is found, stop
  and surface it for the user to decide on rotation/history-rewrite.
- Do not remove the Credentials provider — it is an accepted, mitigated decision
  (ADR-006/007). Confirm the mitigation, don't undo the architecture.

## Validation
```bash
npm run build && npm run test && npm run test:e2e
npm run lint
```
- `/security-review` run; findings list in `CHANGELOG.md` with fixed/deferred
  status for each.
- Secret scan clean: no credentials in tree or history; ignore rules confirmed.
- Dead code removed (or explicitly noted as out-of-scope) — build/tests still
  green, no behaviour change.
- A short written verdict in `CHANGELOG.md`: is the repo safe to be public, and
  what (if anything) remains.

## Completion
1. Update `CHANGELOG.md` (the findings + verdict are the deliverable).
2. Mark step complete in `PLAN.md`.
3. Commit `step-16.4: cleanup & security review`.
4. Push `at-wip`.
