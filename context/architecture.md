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
- Redux Toolkit + RTK Query
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

- **RTK Query** owns all server state (requests, votes, board data) — caching, refetching, and optimistic updates.
- **Redux Toolkit slices** own client state that isn't server-derived:
  - `requestsSlice` — normalized requests (entity adapter), filter/sort state
  - `boardSlice` — column order and drag state (dashboard)
- Optimistic updates on upvote, so the count reflects immediately and rolls back on failure.

## Data Model

- `EndUser` — id, externalId (host-supplied id, upserted on every widget request), name, email. Widget-only; no credentials.
- `TeamMember` — id, name, email, password credential. Admin dashboard-only; signs in.
- `FeatureRequest` — id, title, description, status, category (optional free-text string, no predefined list), authorId (→ `EndUser`), createdAt
- `Vote` — userId (→ `EndUser`) + requestId, with a **unique constraint on (userId, requestId)** to enforce one vote per user per request at the database level
- `Comment` — requestId, userId (→ `EndUser`), body, createdAt *(future)*

Status is an enum: `BACKLOG | PLANNED | IN_PROGRESS | SHIPPED`.

## Auth

### Widget identity (EndUser)

- **MVP:** the host app passes the current end user's id/name/email into `Roadly.init(...)`. The backend upserts an `EndUser` row keyed by that host-supplied id (stored as `externalId`) and trusts the identity as-is (identified but unverified). Documented as a deliberate trade-off.
- **Future:** the host app's backend signs a short-lived JWT with a shared secret; the widget passes it at init; the backend verifies signature and expiry before trusting the identity. Prevents impersonation.

### Admin dashboard auth (TeamMember)

- Self-built: JWT access tokens + refresh tokens, httpOnly cookies.
- **MVP:** a single role. NestJS guards enforce authentication only — any signed-in `TeamMember` has full access (view, change status).
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