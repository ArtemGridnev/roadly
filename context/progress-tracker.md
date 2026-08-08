# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Building `apps/api` (NestJS + Prisma + Postgres).

## Current Goal

- Bring the Prisma schema in line with the multi-tenant `Workspace` model documented in `architecture.md` and `docs/adr/0003-multi-tenant-workspace-model.md` (`Contact`/`Agent`, scoped `FeatureRequest`/`Vote`), then continue building the feature-requests resource on top of it.

## Completed

- Monorepo skeleton on `feat/monorepo-skeleton`: root `package.json`, `pnpm-workspace.yaml`, `turbo.json` (build/dev/lint/type-check/test pipelines), root `tsconfig.base.json` (strict mode), `.gitignore`.
- Placeholder packages for `apps/widget`, `apps/dashboard`, `apps/api`, `packages/shared` — each with `package.json`, `tsconfig.json` extending the base config, a stub `src/index.ts`, and a `README.md` pointing back to `architecture.md`/`code-standards.md` for its intended stack.
- App-level scripts (`build`/`dev`/`lint`/`test`) are no-op stubs; `type-check` runs real `tsc --noEmit` against each package. Verified `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm test` all run cleanly through Turborepo across all 4 packages.
- `apps/api` scaffolded on `feat/api-feature-requests-resource`: NestJS skeleton, `PrismaService`/`PrismaModule`, local Postgres via `docker-compose.yml` (port 5433), initial migration.
- On `feat/split-enduser-teammember` (uncommitted, awaiting the user's own review before any commit): replaced the placeholder single `User` model with `EndUser`/`TeamMember` per `docs/adr/0002`, then superseded that with the multi-tenant model per `docs/adr/0003-multi-tenant-workspace-model.md` — added `Workspace` (tenant, `widgetKey`) and `WorkspaceMember` (join table), renamed `EndUser` → `Contact` (now workspace-scoped, `@@unique([workspaceId, externalId])`) and `TeamMember` → `Agent` (stays a global identity, joins Workspaces via `WorkspaceMember`), added denormalized `workspaceId` to `FeatureRequest`, renamed `Vote.userId` → `Vote.contactId`.

## In Progress

- `feature-requests` resource (controller/service/DTOs) on `feat/api-feature-requests-resource` — not yet wired to the `Contact`/`Workspace`-scoped schema end-to-end (e.g. no endpoint resolves a `Workspace` from `widgetKey` or creates/looks up `Contact` rows yet).

## Next Up

- Seed at least one `Workspace` (+ `Agent` + `WorkspaceMember`) row — required now that `Contact`/`FeatureRequest`/`WorkspaceMember` all carry required `workspaceId`/`agentId` foreign keys, so local API testing needs a tenant to attach test data to.
- Wire widget-facing endpoints to resolve `Workspace` by `widgetKey`, then upsert `Contact` by `(workspaceId, externalId)` per the MVP auth model (host-supplied identity, unverified).
- Build `Agent` auth (JWT + refresh, httpOnly cookies) for the admin dashboard, including how an `Agent` with multiple `WorkspaceMember` rows selects the active Workspace (not designed yet).

## Open Questions

- None.

## Architecture Decisions

- `docs/adr/0003-multi-tenant-workspace-model.md`: Roadly is one shared multi-tenant deployment, not one deployment per customer — supersedes `docs/adr/0001-single-tenant-deployment.md`. Also renames `EndUser`→`Contact`, `TeamMember`→`Agent` (terminology-only re: `docs/adr/0002`, identity split unchanged) and makes `Agent` a global identity linked to Workspaces via `WorkspaceMember` rather than one Workspace per Agent.

## Session Notes

- 2026-07-25: Grilled context/ docs against each other before implementation start. Fixed stale microfrontend/"training sessions" boilerplate in `AGENTS.md`/`ai-workflow-rules.md`; resolved a Status enum conflict (canonical: `BACKLOG | PLANNED | IN_PROGRESS | SHIPPED`); resolved admin roles as single-role for MVP; split `User` into `EndUser`/`TeamMember`; unified "Roadmap Board" naming; clarified `category` as free-text. See root `CONTEXT.md` for the resulting glossary and `docs/adr/0001-single-tenant-deployment.md` / `docs/adr/0002-separate-enduser-teammember.md` for the two hard-to-reverse decisions that came out of it.
- 2026-08-08: Implemented the `EndUser`/`TeamMember` split in `prisma/schema.prisma` (previously still a single placeholder `User` model from the initial NestJS scaffold). Local dev DB had 3 test `FeatureRequest` rows authored by a manually-created `user_test_1` row; deleted them (disposable test data) rather than resetting the whole dev DB, then completed the migration's foreign keys by hand after `prisma migrate deploy` partially applied and failed on the FK step. No production/shared data involved — local dev only.
- 2026-08-08 (same day, later): Realized mid-review that single-tenant-per-deployment (ADR 0001) doesn't fit the actual product goal — a real shared SaaS serving many customer businesses. Wrote `docs/adr/0003-multi-tenant-workspace-model.md` to supersede it: added `Workspace`/`WorkspaceMember`, renamed `EndUser`→`Contact` and `TeamMember`→`Agent` (still avoiding bare "User" per ADR 0002's original reasoning), made `Agent` a global identity spanning Workspaces instead of one-Workspace-per-Agent. Applied locally via `prisma migrate dev`; left uncommitted on `feat/split-enduser-teammember` at the user's request, to review the full schema themselves before anything is committed.
