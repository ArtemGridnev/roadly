# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Monorepo scaffolding.

## Current Goal

- Stand up the pnpm + Turborepo skeleton per `architecture.md` before building any app feature.

## Completed

- Monorepo skeleton on `feat/monorepo-skeleton`: root `package.json`, `pnpm-workspace.yaml`, `turbo.json` (build/dev/lint/type-check/test pipelines), root `tsconfig.base.json` (strict mode), `.gitignore`.
- Placeholder packages for `apps/widget`, `apps/dashboard`, `apps/api`, `packages/shared` — each with `package.json`, `tsconfig.json` extending the base config, a stub `src/index.ts`, and a `README.md` pointing back to `architecture.md`/`code-standards.md` for its intended stack.
- App-level scripts (`build`/`dev`/`lint`/`test`) are no-op stubs; `type-check` runs real `tsc --noEmit` against each package. Verified `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm test` all run cleanly through Turborepo across all 4 packages.
- No app-level dependencies (React, Vite, NestJS, Prisma, etc.) installed yet, and no cross-workspace dependency wiring (e.g. apps → `@roadly/shared`) added yet — deliberately deferred until each app is built.

## In Progress

- None.

## Next Up

- Pick one app to build first and wire in its real framework/tooling (replacing its stub scripts).

## Open Questions

- None.

## Architecture Decisions

- None.

## Session Notes

- 2026-07-25: Grilled context/ docs against each other before implementation start. Fixed stale microfrontend/"training sessions" boilerplate in `AGENTS.md`/`ai-workflow-rules.md`; resolved a Status enum conflict (canonical: `BACKLOG | PLANNED | IN_PROGRESS | SHIPPED`); resolved admin roles as single-role for MVP; split `User` into `EndUser`/`TeamMember`; unified "Roadmap Board" naming; clarified `category` as free-text. See root `CONTEXT.md` for the resulting glossary and `docs/adr/0001-single-tenant-deployment.md` / `docs/adr/0002-separate-enduser-teammember.md` for the two hard-to-reverse decisions that came out of it.
