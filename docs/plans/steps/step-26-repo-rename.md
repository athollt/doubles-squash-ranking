# Step 26: GitHub repo rename → `rungs-app`

## Objective
Rename the GitHub repository from `athollt/doubles-squash-ranking` to
`athollt/rungs-app`, completing the Rungs rebrand at the version-control layer.
This is the last name still carrying the old "squash" identity after the in-app
rebrand (step 24) and the Fly/domain cutover (step 25). The new name **mirrors the
live Fly app** (`fly.toml` → `app = 'rungs-app'`), so infra and repo agree.

Like step 25 this is mostly a **manual ops action** (the rename happens in the
GitHub UI/API), plus a small set of in-repo edits to the **live** references. It is
**GitHub-only** — it does **not** touch Fly, the deploy token, or the Actions
workflow (see note below).

## Context
- Read first: `AGENT-NOTES.md` (PR-via-curl uses the repo slug), `CHANGELOG.md`
  (step 25 entry — infra already renamed), `OVERVIEW.md` heading.
- Depends on step 25: the infra + domain are already `rungs`; this aligns the repo.
- **GitHub keeps the old URL redirecting** (`athollt/doubles-squash-ranking` →
  `athollt/rungs-app`) for git, web, and API indefinitely. The redirect is a
  **backstop, not the plan** — this step hard-updates the live references and resets
  the local remote so nothing relies on it.

### Why Fly/deploy is unaffected
GitHub Actions runs **inside** the repo regardless of its name; renaming the repo
does not change the workflow, the `FLY_API_TOKEN` secret, or the Fly app
(`rungs-app`). No deploy-side change is needed or made in this step.

## Rename map (the edits — live references only)
| Thing | Current | Target |
|---|---|---|
| GitHub repo | `athollt/doubles-squash-ranking` | `athollt/rungs-app` |
| `AGENT-NOTES.md` title (line 1) | `Agent Notes: doubles-squash-ranking` | `Agent Notes: rungs-app` |
| `AGENT-NOTES.md` PR curl URL (line ~26) | `…/repos/athollt/doubles-squash-ranking/pulls` | `…/repos/athollt/rungs-app/pulls` |
| `OVERVIEW.md` heading (line 1) | `# OVERVIEW — doubles-squash-ranking` | `# OVERVIEW — rungs-app` |
| `docs/deployment/03-github-actions.md` repo refs (~lines 16, 27) | `github.com/athollt/doubles-squash-ranking` | `github.com/athollt/rungs-app` |
| `RUNGS-PLAN.md` "Target repo" (line 4) | `doubles-squash-ranking` (→ rebranded **Rungs**) | `rungs-app` (rebrand complete) |
| `package.json` `name` | `doubles-squash-ranking` | `rungs-app` |
| `package-lock.json` `name` | `doubles-squash-ranking` | `rungs-app` (via `npm install`) |
| VS Code workspace file | `Doubles @ BSC.code-workspace` | `rungs-app.code-workspace` (`git mv`; relative `folders` paths unchanged) |

> **Leave historical records untouched** (append-only — AGENTS.md §4): the old slug
> in `CHANGELOG.md`, `PLAN.md`, `PRD-rungs.md`, `PRD-doubles-squash-ladder.md`, and
> `steps/step-14.3-github-actions.md` is *history*, not current state. The rename is a
> **new event** recorded in a new CHANGELOG entry, not a rewrite of past ones.

## Specification (manual/ops — record results in CHANGELOG)
1. **Rename on GitHub (owner):** Settings → repository name →
   `rungs-app`. (Or `PATCH /repos/athollt/doubles-squash-ranking` with
   `{"name":"rungs-app"}`.) GitHub installs the redirect automatically.
2. **Local remote:** `git remote set-url origin
   https://github.com/athollt/rungs-app.git`; confirm with `git remote -v` and a
   `git fetch`.
2a. **Local working-copy folder:** rename the checkout to stay in sync —
   `mv ~/SourceCode/doubles-squash-ranking ~/SourceCode/rungs-app` (run from
   *outside* the repo). Reopen the editor/agent on the new path; any saved
   workspace/launch configs, shell aliases, or agent working-dir settings pointing at
   the old path must be repointed. Nothing inside the repo hardcodes its own absolute
   path, so no in-repo edit is required for the folder move.
3. **In-repo edits:** apply the rename map above to the **live** references only.
4. **`package.json` / lockfile:** set `name` to `rungs-app`, run `npm install` so
   `package-lock.json`'s `name` follows. Confirm no other lockfile churn.
5. **Verify the PR path:** the `/create-pr` flow (curl to the new
   `repos/athollt/rungs-app/pulls`) opens this step's PR successfully.

## Behaviours to verify (manual — recorded, not auto-tested)
1. `git clone https://github.com/athollt/rungs-app.git` succeeds.
2. The **old** URL (`…/doubles-squash-ranking`) redirects (git + web) — backstop intact.
3. A push to `at-wip` still triggers the Fly deploy via GitHub Actions (repo rename
   left the workflow + `FLY_API_TOKEN` untouched).
4. `/create-pr` opens a PR against `athollt/rungs-app` (new slug in the curl URL).

## Validation
```bash
npm run build && npm run test
```
The only code changes are text/name references (no route or behaviour change), so the
local gate is build + unit. The rename itself + redirect + deploy are verified
**manually on GitHub** and recorded in CHANGELOG. (No route change → no new E2E.)

## Completion
1. Update `CHANGELOG.md` (rename map applied + verification results; note the old URL
   redirect and that Fly/deploy were intentionally untouched).
2. Mark step 26 complete in `RUNGS-PLAN.md`.
3. Commit `step-26: GitHub repo rename → rungs-app`.
4. Push `at-wip`. (Release via `/create-pr` — manual merge to `main`.)

## Note: the PR script lives in `agent-tools`, not this repo
`AGENT-NOTES.md` references `scripts/open-pr.sh`; that path is **relative to the
shared `agent-tools` workspace**, not this repo — the actual file is
`diffdev/agent-tools/skills/create-github-pr/scripts/open-pr.sh` (the
`create-github-pr` skill). It reads the repo slug from `git remote`, so the repo
rename needs **no edit there** — once `origin` is repointed (step 2), the PR curl
targets `rungs-app` automatically.
