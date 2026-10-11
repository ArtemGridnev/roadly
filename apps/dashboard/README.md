# @roadly/dashboard

Authenticated admin dashboard. The product team triages Feature Requests and manages the Roadmap Board.

In progress — see `context/architecture.md` for the intended stack (React + Redux Toolkit/RTK Query, Vite SPA, shadcn/ui + Radix + Tailwind, dnd-kit, @tanstack/react-table) and `context/dashboard-pages.md` for pages and routes. Scaffold, theme provider, store and RTK Query layer exist; no routes or pages yet.

## Folder structure

| Path | Holds |
|---|---|
| `src/main.tsx`, `src/App.tsx` | Entry point and app root |
| `src/index.css` | Tailwind entry; imports `@roadly/shared/tokens.css` |
| `src/theme/` | `ThemeProvider` / `useTheme` — light, dark, system |
| `src/lib/` | Small shared helpers (`cn`) |
| `src/test/` | Vitest setup |
| `src/store.ts` | Redux store, `RootState`, `AppDispatch` |
| `src/api/` | Base `createApi` (no endpoints), reauth base query |
| `src/features/<feature>/` | Everything for one feature; its endpoints live in `<feature>-api.ts` |
| `src/features/auth/` | Login, signup |
| `src/features/workspaces/` | List and create workspaces; `workspace-slice.ts` holds the active workspace id |
| `src/features/feature-requests/` | List, update (optimistic), delete feature requests |

## Conventions

- Each feature adds its endpoints with `api.injectEndpoints` and exports its own hooks. Import hooks from the feature's `-api.ts` file; there is no barrel.
- The active workspace id lives in `workspaceSlice`, mirrored from the `/:slug` URL. `prepareHeaders` sends it as `x-workspace-id` on every request, so endpoints never take a `workspaceId` arg.
- Cache keys therefore don't include the workspace: changing the active workspace resets the whole RTK Query cache (listener in `store.ts`). Workspace-scoped queries must `skip` until an active workspace is set, or the API answers 400.
