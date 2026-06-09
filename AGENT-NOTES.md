# Agent Notes: doubles-squash-ranking

Project-specific information for the AI agent working on this repo.

**What this is:** **Rungs** — a multi-tenant ranking-ladder PWA (the repo name predates the
rebrand). Each club's ladder is a **League** at `/l/{slug}`; public ladders are login-free,
login is staff-only (global Admin + per-League Scorer grants). See [`OVERVIEW.md`](OVERVIEW.md)
for architecture. The Fly app/Postgres + domain still carry the old `squash` names — the
infra rename to `rungs.co.za` is plan step 25 (pending).

## Branch Protection Rules

- Direct pushes to `main` are blocked
- All changes must go through PRs
- Branch: `at-wip` (working branch) → `main` (integration)
- No Trello cards (personal project)

## Creating PRs on GitHub

The `gh` CLI is not installed. Use the GitHub API via `curl`:

```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/athollt/doubles-squash-ranking/pulls \
  -d '{"title":"PR title","body":"## Description of change\n\n...\n\n## Testing Done\n\n...\n\n## Commit Message\n\n...","head":"at-wip","base":"main"}'
```

The `GITHUB_TOKEN` is stored in `.env` file. Load it with: `export GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d '=' -f2)`

**Easier:** invoke the **`/create-pr`** skill (`.claude/skills/create-pr/`), which
automates this — it checks the branch is clean + pushed, runs build/test/lint
(+ e2e if routes changed), then POSTs via `scripts/open-pr.sh` and returns the PR
URL. Merging the PR to `main` auto-deploys to prod (Fly GitHub Actions).

## Project Structure

- `docs/plans/` — BR, PRD, PLAN, DECISIONS, CHANGELOG, and step files
- `AGENTS.md` — symlink to agent-tools (do not modify locally)
- `AGENT-NOTES.md` — this file (project-specific agent info)
- `README.md` — technical setup and running instructions

## Next.js Agent Guidance

`AGENTS.md` and `CLAUDE.md` are symlinks to shared agent rules. When working with Next.js, note:

- This is **NOT** the Next.js you know — APIs, conventions, and file structure may differ from training data
- Before writing any Next.js code, read `node_modules/next/dist/docs/` for breaking changes
- Heed deprecation notices in the documentation
- When scaffolding or upgrading Next.js, never replace `AGENTS.md` or `CLAUDE.md` with generated files
