## Branch names

**IMPORTANT:** every branch is named `<type>/<scope>-<topic>`. Check the name against this rule before creating a branch, including when a request only says "create a branch".

- `<type>`: `feat`, `fix`, `refactor` or `chore`.
- `<scope>`: the app or package the change is in: `api`, `dashboard`, `widget` or `shared`. For work outside them, name the area instead (`context`, `db`, `monorepo`).
- `<topic>`: a few kebab-case words.

Right: `feat/dashboard-roadmap-url-filters`, `fix/api-prod-start`. Wrong: `feat/roadmap-url-filters` (no scope).

If a branch was created with a wrong name and isn't pushed yet, rename it with `git branch -m`.

## Commits

**IMPORTANT:** split commits by app, one commit per app or package. Check the split before committing, including when a change looks like one logical unit.

- Message: `<type>(<scope>): <subject>`, one short line, no body, no `Co-Authored-By`. `<scope>` is `api`, `dashboard` or `widget`. For work outside them, leave it out or name the area (`context`).
- `packages/shared` goes in the commit of the API change it belongs to.
- Context docs go in the commit of the app they describe.
- Order the commits so each one type-checks. When removing something, the apps that use it go first; when adding something, the API and `packages/shared` go first.
- Ask for approval before every commit (see `context/ai-workflow-rules.md`).

Right: `refactor(dashboard): remove request category`, then `refactor(widget): remove request category`. Wrong: one `refactor: remove request category` across all apps.

## Project context

Before implementing or making an architectural decision, read `context/CLAUDE.md` and follow it.
