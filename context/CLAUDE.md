## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, features, and scope
2. `context/architecture.md` — system structure, boundaries, storage model, and invariants
3. `context/ui-context.md` — theme, colors, typography, canvas design, and component conventions
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase, completed work, open questions, and next steps

Update `context/progress-tracker.md` after each meaningful implementation change.

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.

## Commands

Turborepo pipelines, run from the repo root:
```bash
pnpm dev          # run all apps in dev mode
pnpm build        # build all apps
pnpm lint
pnpm type-check
pnpm test
```

Run a single vitest test file:
```bash
npx vitest run src/path/to/file.test.ts
```

### Environment variables

`apps/api` requires a `.env` (see `.env.example`):
- `DATABASE_URL` — Postgres connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — admin dashboard auth tokens

`apps/widget` and `apps/dashboard` require `VITE_API_URL` — base URL of the API service.

> Env var names above are inferred from `architecture.md` and not yet confirmed against a real `.env.example` — correct once that file exists.
