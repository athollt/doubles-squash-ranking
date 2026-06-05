# BSC Doubles Squash Ladder — Plan

**Source**: [PRD-doubles-squash-ladder.md](PRD-doubles-squash-ladder.md)
**Target repo**: `doubles-squash-ranking`
**Execution model**: one step per prompt, CHANGELOG as ground truth

---

## Execution Protocol

For each step the agent:
1. Reads `PLAN.md` → status
2. Reads `CHANGELOG.md` → what prior steps delivered
3. Reads `DECISIONS.md` → locked-in architecture
4. Reads `steps/step-XX-*.md` → spec
5. Executes via TDD — vertical tracer bullets, never horizontal
6. Validates: step-specific commands + global validation below
7. Updates `CHANGELOG.md` with what was delivered
8. Marks step `complete` in `PLAN.md`
9. Commits as `step-XX: <step title>`
10. Pushes `at-wip` to origin

### Context Window Protocol
- Human kicks off every step — never auto-continue
- If context permits, human may chain steps in one window
- Each step file is self-contained

### Git Workflow
- **Integration branch**: `main` · **Working branch**: `at-wip`
- **Commit format**: subject `step-XX: <title>`, blank, 1-2 sentence overview, blank, bulleted sections that apply (`New:`, `Wiring:`, `API:`, `Removed:`, `Tests:`), final `Validation:` line.
- After each commit: `git push origin at-wip`
- Agent MUST NOT merge to `main` — manual
- No force-push, no credentials in messages

### TDD Discipline

Each step's `Specification` lists behaviours in order. Apply vertical TDD:

```
For each behaviour:
  RED:   one test → fails
  GREEN: minimal code → passes
```

No writing all tests up front. No testing internal collaborators. Single commit lands after all cycles green and validation passes.

### Key Rules
- Read `CHANGELOG.md` and `DECISIONS.md` before starting any step
- All tests must pass before `complete`
- Document spec deviations in `CHANGELOG.md`
- One commit per step
- Only requested changes in the diff — no drive-by refactors

---

## Step Status

| # | Step | Status | Depends On |
|---|------|--------|------------|
| 01 | [Project scaffold & dev environment](steps/step-01-project-scaffold.md) | complete | — |
| 02 | [Database schema & Prisma setup](steps/step-02-database-schema.md) | complete | 01 |
| 03 | [Rating algorithm engine](steps/step-03-rating-engine.md) | complete | 02 |
| 04 | [Authentication & authorisation](steps/step-04-auth.md) | pending | 02 |
| 05 | [Player management (admin)](steps/step-05-player-management.md) | pending | 04 |
| 06 | [Settings management (admin)](steps/step-06-settings-management.md) | pending | 04 |
| 07 | [Session submission (scorer)](steps/step-07-session-submission.md) | pending | 03, 05, 06 |
| 08 | [Session edit & delete](steps/step-08-session-edit-delete.md) | pending | 07 |
| 09 | [Public ladder page](steps/step-09-public-ladder.md) | pending | 07 |
| 10 | [Public session history](steps/step-10-session-history.md) | pending | 07 |
| 11 | [Public player rating trend](steps/step-11-player-trend.md) | pending | 07 |
| 12 | [User management (admin)](steps/step-12-user-management.md) | pending | 04 |
| 13 | [PWA & branding](steps/step-13-pwa-branding.md) | pending | 09 |
| 14 | [Deployment setup](steps/step-14-deployment.md) | pending | all prior |
| 15 | [Update documentation](steps/step-15-update-docs.md) | pending | all prior |

---

## Validation Command

```bash
npm run build && npm run test
```

---

## Reference Documents

- **Agent notes**: [../AGENT-NOTES.md](../AGENT-NOTES.md) — project-specific agent information
- **PRD**: [PRD-doubles-squash-ladder.md](PRD-doubles-squash-ladder.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Decisions**: [DECISIONS.md](DECISIONS.md)
- **Original spec**: [SPEC-original-google-sheets.md](SPEC-original-google-sheets.md)
- **Tech research**: [RESEARCH-tech-stack.md](RESEARCH-tech-stack.md)
