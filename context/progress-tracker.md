# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- MVP backend access-scoping is complete on `feat/api-access-scoping`. Next: `packages/shared`, then widget/dashboard frontends. See `context/steps-to-mvp.md` for the full phased plan.

## Current Goal

- None — the four access modes (widgetKey-only, widgetKey+contactId, access-token+workspaceId, access-token-only) are all implemented and every e2e suite passes. Move to Phase 2 (`packages/shared`) per `steps-to-mvp.md`.

## Completed

- **Widget-side access scoping (case 1: `widgetKey` only; case 2: `widgetKey` + `contactId`)**:
  - `@WidgetAuth()` / `@RequireContact()` decorators + extended `AccessTokenAuthGuard` (`apps/api/src/auth/guards/access-token-auth.guard.ts`) resolve `x-widget-key` → `Workspace` and `x-contact-id` → `Contact` (scoped to that workspace), attaching both to the request. `@CurrentWorkspace()` / `@CurrentContact()` param decorators expose them to controllers.
  - New `apps/api/src/widget/` module: `POST /widget/contacts` (identify/upsert), `GET /widget/feature-requests` (list), `POST /widget/feature-requests` (submit), `POST /widget/feature-requests/:requestId/votes` (vote) — all header-scoped, no `workspaceKey`/`contactId` in the URL or body.

- **Agent-side access scoping (case 3: `access-token` + `x-workspace-id` header; case 4: `access-token` only)**:
  - New `WorkspaceMembershipGuard` (`apps/api/src/auth/guards/workspace-membership.guard.ts`), applied via `@UseGuards()` — reads `x-workspace-id`, verifies a `WorkspaceMember` row exists for the authenticated Agent (`request.user.sub`, set by the existing Passport strategy), attaches `request.workspace`. 400 if the header is missing, 403 if the agent isn't a member — deliberately not 404, to avoid leaking workspace existence to a non-member.
  - Applied to `contacts`, `feature-requests`, `votes`, `workspace-members` controllers (all four now flat routes — `:workspaceId` path segments dropped in favor of the header, matching the widget pattern). `agents` and `workspaces` stay case 4 (access-token only, no workspace scoping) — global admin actions, per explicit scope decision.
  - `FeatureRequestsController`/`VotesController` now scope every by-id operation (`findOne`/`update`/`remove`/nested votes) through `FeatureRequestsService.findOneForWorkspace`, closing a real cross-tenant gap: previously an authenticated agent could read/mutate another workspace's feature requests or votes by guessing an id.
  - `CreateFeatureRequestDto`/`FindFeatureRequestsQueryDto` had `workspaceId` removed (guard-resolved now, not client-supplied); `FeatureRequestsService.create`/`findAll` take `workspaceId` as an explicit param instead.
  - Renamed `auth/types/widget-context.ts` → `auth/types/auth-context.ts`, `WidgetAuthenticatedRequest` → `AuthenticatedRequest` (now also carries `user?: AccessTokenPayload`) — one shared request-context type across both the widget and agent auth paths.
  - Rewrote all 6 previously-broken e2e suites (`agents`, `workspaces`, `contacts`, `feature-requests`, `votes`, `workspace-members` — they predated JWT auth and never sent a cookie) to authenticate via a new `test/utils/auth.ts` helper (`loginAsNewAgent`, `loginAsAgentInWorkspace`) and send the required headers.
  - **Full suite: 10/10 test files, 119/119 tests passing** (`npx dotenv -e .env.test -- npx jest --config ./test/jest-e2e.json --runInBand`), `tsc --noEmit` and `nest build` both clean.

## Next Up

- `packages/shared` is still empty — needed before `apps/widget`/`apps/dashboard` frontend work starts.
- Decide how a multi-workspace `Agent` selects their active workspace in the dashboard (open question, not yet resolved — the `x-workspace-id` header now makes this concrete: the dashboard needs a workspace switcher that sets it).
- Feature-request list sorting by vote count is not implemented (`FeatureRequestsService.findAll` only sorts by `createdAt`); `project-overview.md` calls for "sortable by votes or newest" — flagged, not built this pass.

## Open Questions

- Does `contacts` need any admin-facing route at all beyond the widget upsert, or should `ContactsController`'s full CRUD be trimmed?
- Is `DELETE` on feature-requests/votes in MVP scope — not mentioned in `project-overview.md`.

## Architecture Decisions

- Widget identity (`widgetKey`, `contactId`) and agent workspace-scoping (`x-workspace-id`) all travel via headers, never path params or body fields — one consistent mechanism across public and admin surfaces, and keeps a future signed-JWT widget-auth migration a one-place change (RTK Query `prepareHeaders`) instead of a route rewrite.
- Agent-side workspace scoping uses the internal `Workspace.id`, not `widgetKey` — the two identifiers serve different trust models (public/non-secret tenant key for the widget vs. an authorization lookup key for agents) and shouldn't be coupled.
- Widget-facing and admin-facing controllers are kept on separate route namespaces/modules (`apps/api/src/widget/*` vs. the existing per-resource controllers) rather than mixed on one controller with per-method guards — structurally prevents an admin capability leaking onto the public API.
- Membership-check failures return 403, not 404, so an agent probing workspace ids can't distinguish "doesn't exist" from "exists but I'm not a member."

## Session Notes

- None.
