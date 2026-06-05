# Step 15: Update documentation

## Objective
Close the documentation loop so docs match the delivered application.

## Context
- Runs after all feature steps are complete.
- Diff baseline = initial commit (entire project is new).
- Read `DECISIONS.md` for any `Promote: candidate` entries.

## Specification

Update the following:

1. **`README.md`** — comprehensive project README:
   - Project purpose and link to live app.
   - Tech stack summary.
   - Local development setup instructions.
   - How to run tests.
   - How to deploy.
   - Link to `docs/DEPLOYMENT.md` for production setup.
   - Link to `docs/plans/` for design documents.

2. **`docs/plans/PRD-doubles-squash-ladder.md`** — update status from `draft` to `delivered`.

3. **`DECISIONS.md`** — promote any candidate entries; add any new decisions made during implementation.

4. **Verify all internal doc links** — no broken relative paths.

## Validation
- Every path referenced in docs exists in the repo.
- README instructions work (dev can follow them to get running).
- PRD status is `delivered`.

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-15: update documentation`
4. Push `at-wip`
