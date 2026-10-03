# Roadly — Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Reuse existing shared components, hooks, and utilities before creating new ones.
- Do not add features, refactoring, or abstractions beyond what the task requires.
- Use shared types from `packages/shared` — never redefine a shape that already exists there.

## TypeScript

- Strict mode enabled throughout.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Use `interface` for object contracts (API payloads, response shapes).
- Validate unknown external input at system boundaries (API responses, host-passed widget props) before trusting it.

## React

- Functional components with hooks only. No class components.
- Component files: PascalCase (`RequestList.tsx`). Hook files: camelCase prefixed with `use` (`useRequests.ts`).

## State Management

- Server state goes through RTK Query. Do not duplicate server data into a slice.
- Client-only state (filters, sort, board/drag) goes in Redux slices, or local `useState` when truly local.
- Define RTK Query endpoints in the API slice, never inline in components.
- Optimistic-update logic (upvote) stays in the API slice, not in components.

## Styling

- Tailwind CSS for all styling. No CSS/SCSS files for application components, no inline `style={{}}`.
- Never hardcode hex values — use the shared token/theme layer.

### Dashboard (`apps/dashboard`)

- Build UI on shadcn/ui + Radix. Reuse existing shadcn components before hand-rolling new ones.

### Widget (`apps/widget`)

- Use Radix primitives + Tailwind, hand-styled. Do not use shadcn here, and do not import dashboard components.
- Set the `container` prop on every Radix portalling component (dropdown, popover, tooltip) to an element inside the shadow root — the default body target loses styling.

## Backend / NestJS

- Controllers stay thin: validate input and delegate. Logic lives in services.
- Access the database through Prisma in services — never in controllers.
- Validate all incoming data at the boundary (DTOs). Never trust request input.
- Put auth/role checks in guards — no ad-hoc permission checks scattered through services.

## API Layer

- Never expose an admin capability on the public (widget) API.
- Do not build widget-identity-verification-dependent logic until that feature lands — treat the host-passed identity as trusted for now.

## Testing

- Vitest + React Testing Library across the whole monorepo.
- Test behavior, not implementation — query by role/text.
- Always cover: vote deduplication, auth/role guards, optimistic-update rollback, status transitions.
- Every bug fix gets a regression test that fails before the fix and passes after.

## Git & Commits

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. Scope where useful: `feat(widget):`, `fix(api):`.
- Feature branches + PRs, even solo. No direct commits to `main`. Branch names: `feat/short-description`.
- Atomic commits — one logical change each; the message explains the *why*.
- Never commit secrets, `.env` files, debug logs, or commented-out code. Provide `.env.example`.

## Forms

- Schema-driven: react-hook-form + `zodResolver` over the shared zod schema from `packages/shared` — never a redeclared shape.
- User-facing error copy is mapped per field in the component, not via zod messages, so shared schemas stay copy-free.
- Normalize input with `setValueAs` (trim; empty optional → `undefined`) so validation sees what will be sent.

## Comments

- Prefer self-documenting code.
- Keep comments only for: business rules, library workarounds, and non-obvious constraints that could cause regressions.

## Forbidden

- New state-management libraries (RTK is the stack).
- shadcn/ui inside the widget.
- Duplicating server state into Redux slices.
- Admin capabilities on the public widget API.
- Inline styles (`style={{}}`) or CSS/SCSS files for application components.
- Direct commits to `main`.

## To Be Established (fill in as patterns emerge)

Lock these down once the first implementation exists — do not invent them prematurely:

- List / loading / empty / error state wrappers.
- Query-key / cache-key conventions for RTK Query endpoints.
- Per-app folder structure — documented in each app's own `README.md`.