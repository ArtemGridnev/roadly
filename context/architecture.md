# Roadly — Architecture

## Repository Structure

Monorepo managed with **pnpm workspaces + Turborepo**.

```
roadly/
├── apps/
│   ├── widget/        # embeddable widget (self-mounting bundle)
│   ├── dashboard/     # admin dashboard (Vite SPA)
│   └── api/           # NestJS backend
├── packages/
│   └── shared/        # shared types, API contracts, utilities
├── turbo.json
└── pnpm-workspace.yaml
```

- **Turborepo** orchestrates build/test/lint pipelines and caches task output, since the three apps build and test independently.
- **`packages/shared`** holds types shared between frontend and backend (request/vote shapes, API DTOs, enums like status columns) so the contract stays in one place.

> This file covers monorepo-level and cross-cutting architecture only. Each app documents its own internal folder structure and conventions in its own `README.md` (e.g. `apps/widget/README.md`), kept colocated with the code so it stays current as the app evolves.

## Stack

### Widget (`apps/widget`)

- React + TypeScript
- TanStack Query (see State Management below — no Redux, unlike the dashboard)
- Built with Vite in **library mode** to a single self-mounting bundle (IIFE/UMD)
- Ships its own React — cannot assume the host app has it
- Mounts into a host-provided container and renders inside a **Shadow DOM** for full style isolation from the host
- **Radix UI primitives (unstyled) + Tailwind CSS**, hand-styled — deliberately NOT shadcn/ui (shadcn assumes a global stylesheet and portals to `document.body`, which fights Shadow DOM)
- lucide-react icons
- react-hook-form + zod for the submit form
- Shares design tokens (colors, radius, spacing, Inter) with the dashboard via `packages/shared`, so it reads as the same product with a lighter, independent component layer
- Theme-overridable via the init `theme` option

### Admin Dashboard (`apps/dashboard`)

- React + TypeScript
- **Vite SPA** (client-side routing, no SSR)
- Redux Toolkit + RTK Query
- shadcn/ui + Radix + Tailwind CSS, lucide-react icons
- dnd-kit for the drag-and-drop Roadmap Board
- @tanstack/react-table for request tables
- react-hook-form + zod for forms
- Framer Motion + tailwindcss-animate for motion, sonner for toasts

### Backend (`apps/api`)

- NestJS
- PostgreSQL + Prisma
- Modular structure: feature modules (requests, votes, auth, users) with services, controllers, DTOs, and guards

### Shared (`packages/shared`)

- TypeScript types and API contract definitions
- zod schemas reused across frontend validation and backend DTOs where practical

## State Management

Diverges by app: the widget ships its own React into host pages, where bundle size matters more than for the dashboard (precedent: widget already skips shadcn/ui too, see Stack above).

- **Dashboard:** RTK Query owns server state. Redux Toolkit slices own non-server client state (`boardSlice` — column order and drag state).
- **Widget:** TanStack Query owns server state. No Redux — no non-server client state to justify it.
- Optimistic updates on upvote, so the count reflects immediately and rolls back on failure (both apps).

## Data Model

Multi-tenant: one shared deployment serves many customer businesses. See `docs/adr/0003-multi-tenant-workspace-model.md`.

- `Workspace` — id, name, slug, widgetKey (public key the widget sends at init to identify its tenant). One per customer business.
- `WorkspaceMember` — links an `Agent` to a `Workspace` it administers, `@@unique([workspaceId, agentId])`. A join table, not a direct FK, so one `Agent` can belong to multiple Workspaces.
- `Agent` — id, name, email (globally unique), password credential. Admin dashboard-only; signs in; global identity, not scoped to a single Workspace.
- `Contact` — id, workspaceId, externalId (host-supplied id, upserted via `POST /widget/contacts` at widget init, unique per `(workspaceId, externalId)` — not globally, since two Workspaces' host apps can send the same externalId), name, email. Widget-only; no credentials.
- `FeatureRequest` — id, workspaceId (denormalized for query/index simplicity), title, description, status, category (optional free-text string, no predefined list), authorId (→ `Contact`), createdAt
- `Vote` — contactId (→ `Contact`) + requestId, with a **unique constraint on (contactId, requestId)** to enforce one vote per Contact per request at the database level. No `workspaceId` of its own — see ADR 0003 for why. The service-layer check ADR 0003 calls for is implemented: every vote operation first resolves the target `FeatureRequest` through `FeatureRequestsService.findOneForWorkspace`, so a vote can't be read/written against a feature request outside the caller's resolved Workspace.
- `Comment` — requestId, contactId (→ `Contact`), body, createdAt *(future — will need workspaceId too when built)*

Status is an enum: `BACKLOG | PLANNED | IN_PROGRESS | SHIPPED`.

## Auth

Four access modes, all resolved via guards on `apps/api/src/auth/guards/`, never via path/body params:

| Mode | Who | Mechanism | Guard |
|---|---|---|---|
| Public + workspace | Widget, read-only | `x-widget-key` header → `Workspace` | `AccessTokenAuthGuard` (`@WidgetAuth()` branch) |
| Public + workspace + contact | Widget, write | `x-widget-key` + `x-contact-id` headers → `Workspace` + `Contact` | same guard (`@WidgetAuth()` + `@RequireContact()`) |
| Agent + workspace | Dashboard, workspace-scoped resources | access-token cookie (`Agent`) + `x-workspace-id` header, checked against `WorkspaceMember` | `WorkspaceMembershipGuard`, applied via `@UseGuards()` per controller |
| Agent only | Dashboard, global resources (`agents`, `workspaces`) | access-token cookie only | `AccessTokenAuthGuard` default path |

### Workspace resolution

- **Widget:** the `widgetKey` passed at `Roadly.init(...)` is sent as the `x-widget-key` header on every widget API call; the guard resolves it to a `Workspace` and attaches it to the request. Unknown/missing key → 401.
- **Dashboard:** the signed-in `Agent` sends the active `Workspace`'s `id` as the `x-workspace-id` header on every workspace-scoped call; `WorkspaceMembershipGuard` checks a `WorkspaceMember` row exists for that `(Agent, Workspace)` pair. Missing header → 400; agent not a member → 403 (not 404, so workspace existence isn't leaked to a non-member). If an `Agent` belongs to more than one `Workspace`, the dashboard sends whichever one is currently active in this header — the frontend UI for switching between them isn't built yet.
- Both guards attach the resolved `Workspace` to the request the same way (`request.workspace: { id }`), read via one shared `@CurrentWorkspace()` param decorator regardless of which path resolved it.
- Widget-facing and admin-facing routes live on separate controllers/route namespaces (`apps/api/src/widget/*` vs. the existing per-resource controllers, e.g. `contacts`, `feature-requests`) rather than mixed on one controller with per-method guards.

### Widget identity (Contact)

- **MVP:** the host app passes the current end user's id/name/email into `Roadly.init(...)`. The widget calls `POST /widget/contacts` once to upsert a `Contact` row keyed by that host-supplied id (stored as `externalId`, scoped to the resolved Workspace) and gets back a `Contact.id`, which it then sends as `x-contact-id` on subsequent write calls. Identity is trusted as-is (identified but unverified). Documented as a deliberate trade-off.
- **Future:** the host app's backend signs a short-lived JWT with a shared secret; the widget passes it at init instead of raw identity; the backend verifies signature and expiry before trusting the identity. Because identity already travels via headers rather than path/body params, this migration only changes what generates the header value (the widget's TanStack Query fetcher), not the route shapes.

### Admin dashboard auth (Agent)

- Self-built: JWT access tokens + refresh tokens, httpOnly cookies.
- **MVP:** a single role. Beyond authentication, `WorkspaceMembershipGuard` enforces workspace membership on workspace-scoped resources — an `Agent` can only view/change data within a `Workspace` they belong to; `agents`/`workspaces` management stays global (any signed-in `Agent`, no workspace scoping).
- **Future:** role-based guards (admin vs. regular) restrict admin-only actions once multiple roles exist.

## Widget Embedding Model

- Host app includes the bundled script and calls `Roadly.init({ container, user, theme })`.
- The widget self-mounts into the given container and renders inside a **Shadow DOM** for style isolation.
- `theme: 'light' | 'dark' | 'auto'` (default `'auto'`, follows host `prefers-color-scheme`). No in-widget theme toggle.
- Backend exposes a public API surface for the widget (list requests, submit, vote) distinct from the authenticated admin API.

### Shadow DOM constraints (must design around from the start)

- **Tailwind CSS is injected into the shadow root**, not `document.head` — the build inlines the widget CSS and mounts it inside the shadow tree at init, or the classes won't apply.
- **Radix portalling components** (dropdowns, popovers, tooltips) must portal into a container *inside* the shadow root via Radix's `container` prop — the default `document.body` target sits outside the shadow tree and loses all styling. This is the main reason the widget can't reuse dashboard components as-is.
- **Fonts** (`@font-face` for Inter) must be made available to the shadow tree.
- Toasts/overlays, if used in the widget, follow the same in-shadow-root container rule.

## API Surface (high level)

- **Public (widget):** list requests, submit request, upvote request — scoped to the identity passed by the host.
- **Admin (dashboard, authenticated):** manage requests, change status, (future) comments.

## Build & Deploy (planned)

- Turborepo pipelines: `build`, `dev`, `lint`, `test`, `type-check`.
- Widget builds to a static bundle served from a CDN-friendly URL.
- Dashboard builds to static assets (Vite).
- API deployed as a Node service with a managed Postgres instance. 