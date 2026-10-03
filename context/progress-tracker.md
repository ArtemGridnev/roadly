# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Widget frontend, on `feat/widget-ui-base`. Backend access-scoping and `packages/shared` are done; the widget's read-only shell (launcher, tab navigation, feature request list) is built. Dashboard is still an empty package.

## Current Goal

- Widget write surfaces: the submit form (react-hook-form + zod) and the upvote action with optimistic updates. Both were explicitly deferred out of the UI-shell step.

## Completed

- **Widget UI shell — launcher, tab navigation, feature request list (`feat/widget-ui-base`)**:
  - Tailwind v4 (`@tailwindcss/vite`, CSS-first `@theme` in `src/index.css`) carrying the `ui-context.md` token set as OKLCH. Host apps can override `--roadly-primary`, `--roadly-radius`, `--roadly-font-family` on the container — the widget's documented reskin surface.
  - Shadow DOM: the compiled CSS is inlined into the shadow root, while `@font-face` (Inter) and Tailwind's `@property` rules are hoisted to `document.head` by `src/shadow/install-document-styles.ts`. Both at-rules only register document-wide; a browser ignores them inside a shadow root. For `@property` this is load-bearing, not cosmetic — Tailwind v4 compiles `.border` to `border-style: var(--tw-border-style)`, so without the hoist every border in the widget silently disappears. Verified against the built bundle.
  - Dark mode keys off `data-roadly-theme` stamped on the widget's own root (a `.dark` class on `<html>` cannot reach into the shadow tree), via `@custom-variant dark`. `theme: 'auto'` follows the host's `prefers-color-scheme` and tracks changes.
  - Information architecture diverges from the original sketch: two bottom tabs — **Requests** (`ArrowBigUp`, all feature requests, the landing tab since voting is the widget's main job) and **My requests** (`CircleUser`) — with submission kept as a CTA rather than a third tab, per `ui-context.md` §5 ("inline expand, no heavy modals").
  - `RequestList` establishes the list/loading/empty/error wrapper that `code-standards.md` left "to be established": skeleton while pending, `StateMessage` + retry on error, per-view empty copy.
  - `Roadly.init()` now validates host-supplied options at the boundary and threads `theme` into the tree.

- **Sort by votes / newest**:
  - `GET /widget/feature-requests?sort=top|newest` (default `newest`). `top` orders by `_count.votes` with `createdAt desc` as the tie-break so equal-vote requests don't reshuffle between fetches. The widget route has its own query DTO exposing only `sort` — `status` stays admin-only and returns 400 on the widget. `sort` is also accepted on the admin `FindFeatureRequestsQueryDto`. Contract mirrored in `packages/shared` as `widgetFeatureRequestSortSchema`. 5 new e2e tests (126/126).
  - Widget: `SortToggle` ("Most voted" / "Newest") in both tabs via a `toolbar` slot on `RequestList`. Requests defaults to most voted, My requests to newest. Each sort caches under its own query key; `keepPreviousData` keeps the current list visible while the other sort loads.

- **Vote counts on the read path**:
  - `FeatureRequest.voteCount` added to `packages/shared`; `FeatureRequestResponseDto` derives it from a Prisma `_count.votes`, included on every feature-request query. Two e2e regression tests cover a counted and an uncounted request (full suite 121/121).

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

- Widget submit form (react-hook-form + zod) and the "New request" CTA in the panel.
- Widget upvote: needs `hasVoted` on the widget list response (contact-relative, so it belongs on a widget-only response shape, not the shared `FeatureRequest`) plus optional-contact resolution in `AccessTokenAuthGuard` — `GET /widget/feature-requests` currently only resolves a contact when `@RequireContact()` is set. Optimistic update lives in the API slice per `code-standards.md`.
- Widget has no tests yet — Vitest + React Testing Library are the documented stack but not installed in `apps/widget`.
- Decide how a multi-workspace `Agent` selects their active workspace in the dashboard (open question, not yet resolved — the `x-workspace-id` header now makes this concrete: the dashboard needs a workspace switcher that sets it).

## Open Questions

- The widget launcher is `position: fixed` bottom-right rather than flowing inside the host-provided container. That matches how the sketch and every comparable widget behaves, but it means a host container with a `transform`/`filter`/`contain` ancestor will re-parent the containing block and misplace the launcher. Worth deciding whether placement becomes an `init` option.
- `ui-context.md` §5 says the widget should inherit the host page font and fall back to Inter only if none is set. Implemented as an overridable `--roadly-font-family` defaulting to Inter, which inverts that default — the host opts in to its own font rather than the widget detecting one. Confirm this reading or change the default.
- Does `contacts` need any admin-facing route at all beyond the widget upsert, or should `ContactsController`'s full CRUD be trimmed?
- Is `DELETE` on feature-requests/votes in MVP scope — not mentioned in `project-overview.md`.

## Architecture Decisions

- Widget identity (`widgetKey`, `contactId`) and agent workspace-scoping (`x-workspace-id`) all travel via headers, never path params or body fields — one consistent mechanism across public and admin surfaces, and keeps a future signed-JWT widget-auth migration a one-place change (RTK Query `prepareHeaders`) instead of a route rewrite.
- Agent-side workspace scoping uses the internal `Workspace.id`, not `widgetKey` — the two identifiers serve different trust models (public/non-secret tenant key for the widget vs. an authorization lookup key for agents) and shouldn't be coupled.
- Widget-facing and admin-facing controllers are kept on separate route namespaces/modules (`apps/api/src/widget/*` vs. the existing per-resource controllers) rather than mixed on one controller with per-method guards — structurally prevents an admin capability leaking onto the public API.
- Membership-check failures return 403, not 404, so an agent probing workspace ids can't distinguish "doesn't exist" from "exists but I'm not a member."

## Session Notes

- None.
