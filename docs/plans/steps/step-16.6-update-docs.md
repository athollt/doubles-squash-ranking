# Step 16.5: Update documentation (16.x wrap-up)

## Objective
Close the documentation loop for the 16.x testing-feedback round so docs match
the delivered changes.

## Context
- Runs after 16.1–16.4 and after any `/review-changes` pass.
- Diff baseline = the commit before step 16.1 (the whole 16.x round).
- Read `DECISIONS.md` for any `Promote: candidate` entries introduced during 16.x.

## Specification

Update only docs the 16.x diff touched:

1. **`README.md`** — if the sign-in flow, submit flow, or any documented
   user-facing behaviour changed, bring the README into line.
2. **`docs/plans/DECISIONS.md`** — add any new decision made during 16.x (e.g. the
   sign-in split, the two-phase submit), and promote any candidate entries.
3. **`docs/plans/RESEARCH-whatsapp-notifications.md`** — if a WhatsApp direction
   was chosen out of the research doc, record the decision; otherwise leave it as
   an open follow-up and note that here.
4. **Verify all internal doc links** — no broken relative paths.

If the diff touched no documented surface and there are no candidates, record
`no doc changes required` and close the step — do not drop it.

## Validation
- Every path referenced in updated docs exists in the current commit; links
  relative.
- Promote-candidates are either promoted or explained in `CHANGELOG.md`.

## Completion
1. Update `CHANGELOG.md`.
2. Mark step complete in `PLAN.md`.
3. Commit `step-16.5: update documentation`.
4. Push `at-wip`.
