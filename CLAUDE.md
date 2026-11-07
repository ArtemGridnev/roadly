## Branch names

**IMPORTANT:** every branch is named `<type>/<scope>-<topic>`. Check the name against this rule before creating a branch, including when a request only says "create a branch".

- `<type>`: `feat`, `fix`, `refactor` or `chore`.
- `<scope>`: the app or package the change is in: `api`, `dashboard`, `widget` or `shared`. For work outside them, name the area instead (`context`, `db`, `monorepo`).
- `<topic>`: a few kebab-case words.

Right: `feat/dashboard-roadmap-url-filters`, `fix/api-prod-start`. Wrong: `feat/roadmap-url-filters` (no scope).

If a branch was created with a wrong name and isn't pushed yet, rename it with `git branch -m`.

## Project context

Before implementing or making an architectural decision, read `context/CLAUDE.md` and follow it.
