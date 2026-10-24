# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Admin Dashboard, on `feat/dashboard-workspace-switcher`. Widget feature set is complete. Dashboard has routing, guards 1–4, the standalone shell, sign up, sign in, and onboarding with the create-workspace form; `/onboarding` has its own sign-out button. Workspace pages sit in the app shell (sidebar + top bar) and are still placeholders.

## Current Goal

- Roadmap Board in four steps: 1 read-only kanban (done), 2 drag to change status (done), 3 table view + view toggle + status filter, 4 drawer (edit, status, delete).

## Completed

- **Roadmap Board, step 2 — drag to change status (`feat/dashboard-roadmap-board`)**:
  - `@dnd-kit/core` added. `RoadmapBoard` owns the `DndContext`: columns are droppables (id = status, ring while hovered), cards are draggables via `DraggableCard`, and a `DragOverlay` copy follows the pointer so the horizontal scroll container doesn't clip it.
  - Sensors: mouse (5px), touch (250ms press so sideways scrolling still works), keyboard with a custom coordinate getter that jumps ←/→ a whole column. Collision: `pointerWithin`, falling back to `rectIntersection` for the keyboard. Announcements and instructions name the request and column instead of ids.
  - A drop calls the existing optimistic `updateFeatureRequest`; same-column drops send nothing. On failure the mutation's rollback returns the card and an inline alert names it; dismiss button, cleared by the next successful move.
  - `BoardCard` is now a plain card body (no `li`) so the overlay can reuse it.
  - Seen in a real browser (Playwright, bundled Chromium): the overlay's default drop animation flew back to the card's old slot after the optimistic move had already put it in the new column. Now skipped when the card lands in another column; kept for cancels and same-column drops. The hover ring is `ring-inset` — the scroll container clipped an outer ring top and bottom.
  - Status colors: `STATUS_LABELS` became `STATUS_META` (label + title, column and drop-ring classes per status, from the `ui-context.md` table). Columns tint with their status, the header title takes the status text color, and the drop ring is the status color. Columns now size to their content (`items-start`).
  - Fixed the whole page scrolling sideways on narrow screens (sort button cut off, two horizontal scrollbars): `SidebarInset` needed `min-w-0`, otherwise it never shrank below the board's ~1200px row. Checked at 390/600/954/1280px — page width = viewport, only the board scrolls.
  - Toasts: shadcn `sonner` added; its `next-themes` import swapped for our `useTheme` (dependency removed) and its `--popover`/`--radius` vars pointed at our `--color-*`/`--radius-lg` tokens. `<Toaster />` in `App` and `renderApp`. The inline move-failure alert became `toast.error('Couldn't move "<title>" to <column>')` (one toast per request; no retry button — a drag is cheap to redo, and a retry could resend a stale move). Test setup stubs `setPointerCapture` (sonner's swipe).
  - Scroll lives in the page card: the shell is `h-svh`, `SidebarInset` clips, `PageContent`'s body is `overflow-auto` — the page never scrolls, the top bar stays put, and the board's scrollbar sits on the card's bottom edge. The board row dropped its own `overflow-x-auto`; `min-w-max` below `lg` keeps the trailing padding when scrolled to the end. Browser-checked at 390/600/954/1100/1440px, the Install page included; dragging a card to the edge auto-scrolls the card (Backlog → Shipped at 954px).
  - `RoadmapBoard` only renders and wires drag events; dnd-kit setup (sensors, collision, keyboard steps, announcements) lives in `board-dnd.ts` (`useBoardDnd`), the move + failure state in `useMoveRequest`.
  - 3 new tests in `RoadmapPage.test.tsx` (61/61), driven through the keyboard sensor with a `getBoundingClientRect` stub laying out the columns. Checked that dropping the failure alert and dropping the same-column guard each fail a test. Mouse drag checked in the browser; touch still untested. Bundle 737 kB (236 kB gzipped).

- **Pages own their top bar (`feat/dashboard-roadmap-board`)**:
  - Replaced the layout-owned header (title from route `handle`, actions through a context + portal slot) with `PageContent` (`title`, optional `actions`, optional body `className`) rendered by each page. `AppLayout` is now only sidebar + inset; `PageHandle`, `PageActions` and `page-actions-context` are gone.
  - While `RequireActiveWorkspace` waits for the active workspace, the top bar no longer shows (it used to show the title over an empty body).
  - Tests unchanged (58/58). Checked that dropping `actions` in `PageContent` fails the sort test.

- **Roadmap Board, step 1 — read-only kanban (`feat/dashboard-roadmap-board`, stacked on `feat/dashboard-install`)**:
  - `/:slug/roadmap` → `features/roadmap/RoadmapPage`: one `GET /feature-requests?sort=` grouped client-side into Backlog / Planned / In progress / Shipped columns (count, "No requests" when empty). `BoardCard`: read-only votes, title, 2-line description, category, date — no status badge.
  - Sort (Most voted default / Newest) is a `SortMenu` dropdown in the top bar, state in `roadmapSlice`; the API sorts. Skeleton columns while loading, `LoadError` + retry on failure, empty board → "Install the widget".
  - Columns are fixed 18rem and scroll sideways below `lg`, share the width from `lg`.
  - `mockApi` handlers now also get the request `URL` (for query params); three tests asserting exact handler args take `expect.anything()` for it. The routing/switcher tests that waited for the roadmap placeholder now stub an empty list and wait for the empty state.
  - 4 new tests in `RoadmapPage.test.tsx` (58/58). Checked that dropping the sort arg and dropping the status filter each fail a test. Not visually verified. Bundle 692 kB (220 kB gzipped).

- **Dashboard Install page (`feat/dashboard-workspace-switcher`)**:
  - `/:slug/install` → `features/install/InstallPage`: a full HTML snippet (`#roadly` div, `<script src>`, `Roadly.init` with the real key and `currentUser.*` placeholders) with a `CopyButton` (clipboard, "Copied" / "Couldn't copy" for 2s, no toast), plus three steps ending in a Roadmap link. No separate widget key section — the snippet already carries it.
  - New required `VITE_WIDGET_URL` (the hosted `widget.js`); `install-snippet.ts` throws at startup without it, like `VITE_API_URL`. Dev default `http://localhost:4173/widget.js` = widget `pnpm build && pnpm preview`.
  - 3 new tests in `InstallPage.test.tsx` (54/54); placeholder assertions in the routing/onboarding/switcher tests now wait for the page heading. Checked that a hardcoded key in the snippet fails 2 tests.
  - Not visually verified. Bundle now 684 kB (218 kB gzipped).

- **Dashboard workspace switcher (`feat/dashboard-workspace-switcher`)**:
  - `WorkspaceSwitcher` in the sidebar header, in one row to the right of the Roadly mark: workspaces as checkbox items (checked = current), picking one navigates to its roadmap; **New workspace** opens a shadcn `Dialog` (added; `cn` package and styles fixed again) with `CreateWorkspaceForm`. Dialog state lives outside the dropdown (`modal={false}`) — the Radix dropdown→dialog combo otherwise leaves the page unclickable.
  - `CreateWorkspaceForm` no longer navigates; it takes `onCreated(workspace)`. Onboarding replaces history, the dialog closes and pushes.
  - Switching no longer blanks the app: the store listener still resets the API cache on a workspace change but re-seeds `getMe` and `getWorkspaces` with `upsertQueryEntries` (sync), so the guards keep rendering. `authApi` / `workspacesApi` are exported for it.
  - The "wait for the active workspace" gate moved from `WorkspaceRoute` to a new `RequireActiveWorkspace` layout below `AppLayout`, so the shell stays mounted and only the page area waits.
  - Fixed a race: after creating on onboarding, the workspace refetch made `RequireNoWorkspace` redirect to `/` (→ roadmap) while the form navigated to install. The guard now decides once, from the list on arrival.
  - 4 new tests in `WorkspaceSwitcher.test.tsx` (51/51). Checked that dropping the re-seed fails the no-remount test.

- **Dashboard app shell (`feat/dashboard-shell`)**:
  - shadcn `sidebar` (+ `sheet`, `tooltip`, `separator`, `skeleton`, `use-mobile`) and `dropdown-menu` added, edited to the `ui-context.md` hard rules (`rounded-lg`, `shadow-sm` on floating surfaces, 15rem sidebar, pointer cursor on menu items). The CLI again added an npm package named `cn` and imported from it — removed, imports pointed at `@/lib/utils`. Its hardcoded `--sidebar-*` colors replaced by `@theme inline` aliases onto the shared tokens in `index.css`.
  - Inset layout (`variant="inset"`): flat sidebar, main content as a bordered `bg-card` card — shadcn's inset shadow swapped for a border per the static-card rule.
  - `AppLayout` wraps the `/:slug` pages: `AppSidebar` (workspace name, Roadmap / Install nav, footer with a `ThemeToggle` row (light/dark/system) above `UserMenu` (name/email, sign out)) and a top bar with the page title from the route's `handle`. Below `md` the sidebar is a sheet behind an "Open menu" button and closes after navigating.
  - Logo (`RoadlyLogo.tsx`, theme-aware, `ui-context.md` §3a): full logo above standalone pages, mark in the sidebar header, `public/roadly-icon.svg` as favicon.
  - `WorkspaceRoute` passes the resolved workspace as outlet context (`useCurrentWorkspace()`). Routes split so the shell isn't inside the centered `StandaloneLayout`; `StandaloneLayout` takes optional children so `RequireAgent` / `WorkspaceRoute` keep their error and not-found states centered.
  - Tests: `matchMedia` stub in `test/setup.ts`, `renderApp` wraps `ThemeProvider`. 5 new tests in `AppLayout.test.tsx` (47/47). Checked that dropping the close-on-navigate fails the mobile test.
  - Not visually verified — Playwright's Chrome still crashes on launch. Bundle now 655 kB (207 kB gzipped).

- **Dashboard guards 3–4 (`feat/dashboard-workspaces`)**:
  - Guard 3: `WorkspaceRedirect` on `/` sends an Agent with workspaces to `/:slug/roadmap` of the last-used workspace (slug in `localStorage`, `last-workspace.ts`), falling back to the first. `/login` and `/signup` reach it through `GuestOnly`; `/onboarding` through the new `RequireNoWorkspace` layout guard.
  - Guard 4: `WorkspaceRoute` layout on `/:slug` resolves the slug against `GET /workspaces`. Unknown slug → "Workspace not found" with a link to `/`. Known slug → sets `activeWorkspaceId` (so `x-workspace-id` goes out) and remembers it as last used; children render only once the active id matches, so their first requests carry the right header.
  - `/:slug` redirects to `/:slug/roadmap`. `roadmap` and `install` are placeholders until the app shell and pages exist.
  - 8 new tests in `routes.test.tsx` (42/42). Checked that dropping the last-used write and the onboarding redirect each fails a test. The header gating has no test yet — nothing under `/:slug` calls a workspace-scoped endpoint until the board lands.

- **Dashboard onboarding + create-workspace form (`feat/dashboard-workspaces`)**:
  - `/onboarding` opens straight on `CreateWorkspaceForm` ("Create your first workspace") — no intro step. The form is standalone so the switcher's dialog can reuse it.
  - Name + URL (slug) over the shared `createWorkspaceSchema`. The slug follows the name (`slugify` in `features/workspaces/slug.ts`) until edited by hand. 409 → "That URL is taken. Try acme-2." (`nextSlug` — a guess, not checked for availability); 400 → slug rules message; other failures → generic form error. On success → `/:slug/install`, replacing the history entry so Back doesn't return to the form.
  - `/:slug/install` is a placeholder route until the Install page and app shell exist.
  - 9 new tests in `OnboardingPage.test.tsx` (34/34); sign-up/sign-in/routing tests now look for the form heading. Checked that dropping the hand-edit check fails a test. Not visually verified.

- **Dashboard session expiry + API URL check (`feat/dashboard-auth`)**:
  - When a refresh fails on any request except `/auth/me`, the base query dispatches `sessionExpired`; a store listener resets the RTK Query cache, so `RequireAgent` rechecks and lands on `/login`. Before, the cached agent kept the page up and the failed query showed "We couldn't reach Roadly" (also hit after signing out in another tab). `/auth/me` is excluded — its 401 already reaches the guards, and resetting on it would refetch forever. Regression test in `routes.test.tsx` (25/25).
  - `base-query.ts` throws at startup if `VITE_API_URL` is unset — without it, requests silently went to the dashboard's own origin and 404'd.

- **Dashboard sign-in + temporary sign-out (`feat/dashboard-auth`)**:
  - `/login`: email + password over the shared `agentLoginSchema`, link to sign up. 401 → "That email and password don't match"; 429 → rate-limit message (login is 5/min per IP+email); other failures → generic form error. The `login` mutation seeds `getMe`, so `GuestOnly` redirects on success, same as sign up.
  - `/onboarding` has a "Sign out" button calling `logout`, which resets the RTK Query cache; `RequireAgent` refetches `getMe`, gets a 401 and lands on `/login`. Kept for good — onboarding has no sidebar (`dashboard-pages.md`).
  - 5 new tests (24/24).

- **Dashboard sign-up flow (`feat/dashboard-auth`)**:
  - React Router 8 (`createBrowserRouter`, routes in `src/routes.tsx`), added to `architecture.md`. Redux `Provider` wired in `main.tsx`; `store.ts` now exports `makeStore()` so tests get a fresh store.
  - Guards as layout routes: `GuestOnly` (`/login`, `/signup` — signed in → `/`), `RequireAgent` (guard 1 — 401 from `getMe` after the refresh attempt → `/login`; any other failure → `LoadError` with retry), `WorkspaceRedirect` on `/` (guard 2 — zero workspaces → `/onboarding`). Guards 3–4 not built: `/` with ≥1 workspace shows a placeholder, and `/onboarding` doesn't redirect away yet.
  - `StandaloneLayout` (centered card). `/signup`: name, email, password over the shared `createAgentSchema`; password rule shown as a hint up front, error names what's still missing. 409 → email error with "Sign in instead" link; 429 → rate-limit message; other failures → generic form error.
  - `login`/`signup` mutations seed the `getMe` cache with the returned agent (and no longer invalidate `Agent`), so `GuestOnly` redirects on success and guard 2 lands the agent on `/onboarding` — no navigate in the page.
  - shadcn `button`, `input`, `label`, `card` added (`radix-ui` dep). Edited to the `ui-context.md` hard rules: `rounded-lg`, card has border not shadow. Root `tsconfig.json` got the `@/*` path — without it `shadcn add` writes to a literal `@/` folder and installs an npm package named `cn`.
  - 13 new tests (`routes.test.tsx`, `SignupPage.test.tsx`) over a `fetch` stub (`src/test/mock-api.ts`) and the real route tree (`src/test/render-app.tsx`); 19/19. Checked that breaking the 401 redirect, the 409 handling and input trimming each fails a test.
  - Not visually verified — Playwright's Chrome still crashes on launch here.

- **Widget API fixes (`fix/widget-contact-impersonation`)**:
  - `GET /widget/feature-requests` no longer returns `authorId` — it leaked every contact's id, and `x-contact-id` is the widget's only credential, so anyone could vote or submit as another user. Replaced with `isMine` (shared `WidgetFeatureRequest` omits `authorId`); "My requests" filters on it.
  - `POST /widget/contacts` is find-or-create: an existing contact's name/email are never overwritten, so the public widget key can't rename other users. Profile changes in the host app no longer sync — revisit with signed identity.
  - e2e: 134/134.

- **Dashboard prerequisite APIs (`feat/dashbaord-api-slice`)**:
  - API: `POST /auth/signup`, `GET /auth/me`, `POST /auth/logout` (see `dashboard-pages.md` § API work). New `@CurrentAgent()` param decorator.
  - `GET /workspaces` scoped to the Agent's memberships; `POST /workspaces` creates the creator's `WorkspaceMember` in the same nested create and validates the slug (kebab-case, 3–40, not reserved — `RESERVED_WORKSPACE_SLUGS` in the DTO).
  - Dashboard slice: `signup` → `/auth/signup`, new `getMe` and `logout` (logout resets the RTK Query cache).
  - Admin-side gap fixes: admin `POST /feature-requests` no longer takes `authorId` (column now nullable, migration `optional_feature_request_author`; shared `FeatureRequest.authorId` is `string | null`); admin votes controller removed; `/workspace-members` POST/DELETE removed; `Vote.request` cascades on delete (migration `cascade_votes_on_feature_request_delete`) — deleting any widget-submitted request used to 500.
  - Signup: strong password (8+, lower, upper, digit) in `CreateAgentDto` and shared `createAgentSchema`; `@nestjs/throttler` on login (5/min per IP+email, `LoginThrottlerGuard`) and signup (10/h per IP). Auth e2e spec builds a fresh app per test so throttle counters don't leak between tests.
  - Swagger removed from the API (`main.ts`, nest-cli plugin, `@nestjs/swagger` + `swagger-ui-express`).
  - e2e: 131/131.
  - Closed a cross-tenant hole: `GET/PATCH/DELETE /workspaces/:id` and every `/agents` route let any signed-in Agent read/change any workspace or agent. All removed (unused by the dashboard); `AgentsService` keeps only what auth needs. e2e asserts they 404.

- **Dashboard API slice (`feat/dashbaord-api-slice`)**:
  - `apps/dashboard/src/api/api.ts` holds the empty base `createApi` (base query, tag types); each feature injects its endpoints from its own folder (`src/features/<feature>/<feature>-api.ts`) via `injectEndpoints`. Layout documented in `apps/dashboard/README.md`. Store in `src/store.ts`.
  - `baseQueryWithReauth` sends cookies; on a 401 it calls `POST /auth/refresh` once (shared across concurrent 401s, since the refresh token rotates) and retries.
  - Active workspace id lives in `workspaceSlice` (mirrored from the URL); `prepareHeaders` sends it as `x-workspace-id`. Endpoints take no `workspaceId`, so switching workspace resets the RTK Query cache via a listener in `store.ts`.
  - Endpoints: login, signup, get/create workspaces, list/update/delete feature requests. `updateFeatureRequest` patches every cached list optimistically (dropping/inserting by status filter) and undoes on error.
  - No tests — rollback test lands with the dashboard test stack.

- **Dashboard scaffold + theme (`feat/dashboard-foundation`)**:
  - `apps/dashboard`: Vite 8 + React 19 (React Compiler) + TS, Tailwind v4 via `@tailwindcss/vite` importing `@roadly/shared/tokens.css`, `tw-animate-css`, Inter via `@fontsource/inter` (400/500/600). oxlint, Vitest + jsdom + RTL. shadcn configured by hand (`components.json`, `@/` alias, `cn` in `src/lib/utils.ts`) rather than `shadcn init`, which would have written its own token block over the shared one; no components added yet.
  - `ThemeProvider` / `useTheme` (`src/theme/`): light / dark / system, toggles `.dark` on `<html>`, persists explicit choices to `localStorage` (`roadly-theme`; system = key removed), follows `prefers-color-scheme` live via `useSyncExternalStore`. An inline script in `index.html` applies the theme before first paint and must stay in sync with `theme-storage.ts`. 6 tests.
  - Not visually verified in a browser — Playwright's Chrome crashed on launch in this environment; checked via build output and dev server instead.

- **Shared design tokens (`feat/dashboard-foundation`)**:
  - Color, radius and font tokens moved from `apps/widget/src/index.css` to `packages/shared/src/styles/tokens.css`, exported as `@roadly/shared/tokens.css` (new `exports` map on `@roadly/shared`). Light set in `@theme`; dark set under `.dark, [data-roadly-theme='dark']` so each app keeps its own toggle.
  - Brand, radius and font defaults are raw `--roadly-default-*` vars; the widget keeps its `--roadly-primary` / `--roadly-radius` / `--roadly-font-family` hooks in its own CSS, wrapping those defaults. Compiled widget tokens verified identical before/after against the built bundle.

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
  - Applied to `contacts`, `feature-requests`, `votes`, `workspace-members` controllers (all four now flat routes — `:workspaceId` path segments dropped in favor of the header, matching the widget pattern). `agents` and `workspaces` stay case 4 (access-token only, no workspace scoping) — later narrowed: `/agents` and `/workspaces/:id` removed, `/workspaces` filtered by membership.
  - `FeatureRequestsController`/`VotesController` now scope every by-id operation (`findOne`/`update`/`remove`/nested votes) through `FeatureRequestsService.findOneForWorkspace`, closing a real cross-tenant gap: previously an authenticated agent could read/mutate another workspace's feature requests or votes by guessing an id.
  - `CreateFeatureRequestDto`/`FindFeatureRequestsQueryDto` had `workspaceId` removed (guard-resolved now, not client-supplied); `FeatureRequestsService.create`/`findAll` take `workspaceId` as an explicit param instead.
  - Renamed `auth/types/widget-context.ts` → `auth/types/auth-context.ts`, `WidgetAuthenticatedRequest` → `AuthenticatedRequest` (now also carries `user?: AccessTokenPayload`) — one shared request-context type across both the widget and agent auth paths.
  - Rewrote all 6 previously-broken e2e suites (`agents`, `workspaces`, `contacts`, `feature-requests`, `votes`, `workspace-members` — they predated JWT auth and never sent a cookie) to authenticate via a new `test/utils/auth.ts` helper (`loginAsNewAgent`, `loginAsAgentInWorkspace`) and send the required headers.
  - **Full suite: 10/10 test files, 119/119 tests passing** (`npx dotenv -e .env.test -- npx jest --config ./test/jest-e2e.json --runInBand`), `tsc --noEmit` and `nest build` both clean.

## Next Up

- Roadmap Board step 3: table view (`@tanstack/react-table`), kanban ⇄ table toggle, status filter in table view; plus snap-scrolling ~85vw columns below `lg` (`dashboard-pages.md` → Narrow screens). Active workspace comes from the `/:slug` URL into `workspaceSlice` (`dashboard-pages.md`).
- Widget has no tests yet — Vitest + React Testing Library are the documented stack but not installed in `apps/widget`. First targets: vote toggle optimistic update + rollback, submit form.

## Open Questions

- Shared `createWorkspaceSchema` only requires a non-empty slug; format, length and reserved words live only in the API DTO, so the dashboard learns about a bad slug from a 400. Move the rules into the shared schema (protected) so the form checks them before sending?
- Dashboard bundle is one 521 kB chunk (165 kB gzipped) and Vite warns past 500 kB. Route-level code splitting once more pages land?
- `nest build` emits `dist/src/main.js`, but `start:prod` runs `node dist/main` — pre-existing mismatch, `start:prod` won't boot.
- Rate limiting keys on `req.ip`; behind a proxy in production, Express needs `trust proxy` set or every request shares the proxy's IP.
- Shared `findFeatureRequestsQuerySchema` lacks `sort`, though the admin API accepts it. The dashboard slice adds it locally for now; extend the shared schema (protected) to remove that.
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
