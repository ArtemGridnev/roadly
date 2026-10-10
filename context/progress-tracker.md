# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Widget frontend, on `feat/widget-upvote`. Backend access-scoping and `packages/shared` are done; the widget's read-only shell (launcher, tab navigation, feature request list) is built. Dashboard is still an empty package.

## Current Goal

- Widget feature set is complete (list, sort, submit, upvote). Next: widget test stack, then the Admin Dashboard.

## Completed

- **Widget upvote (`feat/widget-upvote`)**:
  - API: `GET /widget/feature-requests` returns a widget-only `WidgetFeatureRequestResponseDto` (`FeatureRequestResponseDto & { hasVoted }`), mirrored in `packages/shared` as `WidgetFeatureRequest`. `hasVoted` comes from one `vote.findMany` over the listed ids (`VotesService.findVotedRequestIds`), so the shared feature-request query stays contact-agnostic.
  - `AccessTokenAuthGuard` now resolves `x-contact-id` on any `@WidgetAuth()` route when the header is present (an invalid id still 401s); `@RequireContact()` only makes it mandatory. New `@OptionalContact()` param decorator. 4 new e2e tests (130/130).
  - `DELETE /widget/feature-requests/:requestId/votes` removes the current contact's vote (204; 404 if they hadn't voted). `POST /widget/feature-requests` casts the author's vote in the same Prisma create, so a new request starts at 1. Admin-side create is unchanged. 7 new e2e tests (137/137).
  - Widget: `VoteCount` → `VoteButton` (`aria-pressed` toggle, filled primary state once voted). The list query key carries `contactId`, so the list loads before identify and refetches with vote state after it.
  - `useToggleVote` POSTs or DELETEs based on the current `hasVoted`, updates every cached sort list optimistically (count ±1, `hasVoted` flipped), rolls back on error, and refetches on settle — only when it is the last in-flight vote (shared `mutationKey`), so one vote's refetch can't clobber another's optimistic state. A 409/404 from a stale `hasVoted` resolves the same way: rollback, then the refetch shows the real state. Clicks are ignored while that card's vote is in flight.
  - No cap on how many requests a Contact can vote on (explicit decision). "Most voted" re-sorts on the refetch, not on click.
  - Rollback is not covered by a test yet — `code-standards.md` requires it, and it lands with the widget test stack below.

- **Widget UI shell — launcher, tab navigation, feature request list (`feat/widget-ui-base`)**:
  - Tailwind v4 (`@tailwindcss/vite`, CSS-first `@theme` in `src/index.css`) carrying the `ui-context.md` token set as OKLCH. Host apps can override `--roadly-primary`, `--roadly-radius`, `--roadly-font-family` on the container — the widget's documented reskin surface.
  - Shadow DOM: the compiled CSS is inlined into the shadow root, while `@font-face` (Inter) and Tailwind's `@property` rules are hoisted to `document.head` by `src/shadow/install-document-styles.ts`. Both at-rules only register document-wide; a browser ignores them inside a shadow root. For `@property` this is load-bearing, not cosmetic — Tailwind v4 compiles `.border` to `border-style: var(--tw-border-style)`, so without the hoist every border in the widget silently disappears. Verified against the built bundle.
  - Dark mode keys off `data-roadly-theme` stamped on the widget's own root (a `.dark` class on `<html>` cannot reach into the shadow tree), via `@custom-variant dark`. `theme: 'auto'` follows the host's `prefers-color-scheme` and tracks changes.
  - Information architecture diverges from the original sketch: two bottom tabs — **Requests** (`ArrowBigUp`, all feature requests, the landing tab since voting is the widget's main job) and **My requests** (`CircleUser`) — with submission kept as a CTA rather than a third tab, per `ui-context.md` §5 ("inline expand, no heavy modals").
  - `RequestList` establishes the list/loading/empty/error wrapper that `code-standards.md` left "to be established": skeleton while pending, `StateMessage` + retry on error, per-view empty copy.
  - `Roadly.init()` now validates host-supplied options at the boundary and threads `theme` into the tree.

- **Widget submit form**:
  - "New request" CTA floats above the tab bar (per the sketch) and opens `NewRequestOverlay`: a layer over the whole panel with a back arrow, not a tab and not a modal (`ui-context.md` §5). Background is `inert` while open; Escape closes; focus returns to the CTA. Title, description, optional category.
  - react-hook-form + `zodResolver` over the shared `createWidgetFeatureRequestSchema`; values are trimmed before validation so whitespace-only input is rejected. Error copy mapped per field in the component. Pattern recorded in `code-standards.md` § Forms.
  - Button reads "Send request" → "Sending…"; on success the panel switches to My requests (newest first, list invalidated by the existing mutation) and announces "Request sent" via a `role="status"` region. Submit is disabled until the Contact is identified; identify and send failures render inline.
  - New `destructive` color token added to both themes and to `ui-context.md`.
  - **Bundle cost:** 91.9 → 127.2 kB gzipped. ~23 kB of that is zod classic, which does not tree-shake (single deduped copy, verified); react-hook-form ~11 kB, resolver ~1 kB.

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

- Move the design tokens (colors, radius, font) out of `apps/widget/src/index.css` into `packages/shared` so the dashboard imports them instead of copying — decided, do before the dashboard scaffold.
- Widget has no tests yet — Vitest + React Testing Library are the documented stack but not installed in `apps/widget`. First targets: vote toggle optimistic update + rollback, submit form.
- Decide how a multi-workspace `Agent` selects their active workspace in the dashboard (open question, not yet resolved — the `x-workspace-id` header now makes this concrete: the dashboard needs a workspace switcher that sets it).

## Open Questions

- Zod costs the widget ~23 kB gzipped (a quarter of the bundle) because the shared schemas use zod classic, which doesn't tree-shake. Options: accept it; migrate `packages/shared` schemas to `zod/mini` (tree-shakeable, same runtime, different API — touches every consumer); or validate the widget form with react-hook-form's built-in rules instead of the shared schema (diverges from `architecture.md`).
- The launcher uses `rounded-full`, which breaks the `ui-context.md` hard rule (`rounded-lg` everywhere, except status badges). Either square it off or add launchers to the documented exceptions.
- The widget launcher is `position: fixed` bottom-right rather than flowing inside the host-provided container. That matches how the sketch and every comparable widget behaves, but it means a host container with a `transform`/`filter`/`contain` ancestor will re-parent the containing block and misplace the launcher. Worth deciding whether placement becomes an `init` option.
- `ui-context.md` §5 says the widget should inherit the host page font and fall back to Inter only if none is set. Implemented as an overridable `--roadly-font-family` defaulting to Inter, which inverts that default — the host opts in to its own font rather than the widget detecting one. Confirm this reading or change the default.
- Does `contacts` need any admin-facing route at all beyond the widget upsert, or should `ContactsController`'s full CRUD be trimmed?
- ~~Is `DELETE` on feature-requests in MVP scope~~ — resolved: yes, admin-only, from the dashboard drawer (`dashboard-pages.md`). Vote removal is in scope widget-side.

## Architecture Decisions

- Widget identity (`widgetKey`, `contactId`) and agent workspace-scoping (`x-workspace-id`) all travel via headers, never path params or body fields — one consistent mechanism across public and admin surfaces, and keeps a future signed-JWT widget-auth migration a one-place change (RTK Query `prepareHeaders`) instead of a route rewrite.
- Agent-side workspace scoping uses the internal `Workspace.id`, not `widgetKey` — the two identifiers serve different trust models (public/non-secret tenant key for the widget vs. an authorization lookup key for agents) and shouldn't be coupled.
- Widget-facing and admin-facing controllers are kept on separate route namespaces/modules (`apps/api/src/widget/*` vs. the existing per-resource controllers) rather than mixed on one controller with per-method guards — structurally prevents an admin capability leaking onto the public API.
- Membership-check failures return 403, not 404, so an agent probing workspace ids can't distinguish "doesn't exist" from "exists but I'm not a member."

## Session Notes

- None.
