# @roadly/dashboard

Authenticated admin dashboard. The product team triages Feature Requests and manages the Roadmap Board.

In progress — see `context/architecture.md` for the intended stack (React + Redux Toolkit/RTK Query, Vite SPA, shadcn/ui + Radix + Tailwind, dnd-kit, @tanstack/react-table) and `context/dashboard-pages.md` for pages and routes. Scaffold, theme provider, store, RTK Query layer, routing with auth guards, and the sign-up page exist.

## Folder structure

| Path | Holds |
|---|---|
| `src/main.tsx`, `src/App.tsx` | Entry point and app root (Redux `Provider`, `RouterProvider`) |
| `src/routes.tsx` | Route tree; guards are layout routes |
| `src/components/` | App-level components (`StandaloneLayout`, `FormField`, `LoadError`); shadcn source in `ui/` |
| `src/index.css` | Tailwind entry; imports `@roadly/shared/tokens.css` |
| `src/theme/` | `ThemeProvider` / `useTheme` — light, dark, system |
| `src/lib/` | Small shared helpers (`cn`, field ids) |
| `src/test/` | Vitest setup, `mockApi` (stubs `fetch` by `METHOD /path`), `renderApp` (real routes in a memory router, fresh store) |
| `src/store.ts` | `makeStore()` factory, app `store`, `RootState`, `AppDispatch` |
| `src/api/` | Base `createApi` (no endpoints), reauth base query, `getErrorStatus` |
| `src/features/<feature>/` | Everything for one feature; its endpoints live in `<feature>-api.ts` |
| `src/features/auth/` | Login, signup, `getMe`; `RequireAgent` and `GuestOnly` guards |
| `src/features/workspaces/` | List and create workspaces; `workspace-slice.ts` holds the active workspace id; `WorkspaceRedirect` (zero workspaces → `/onboarding`) |
| `src/features/feature-requests/` | List, update (optimistic), delete feature requests |

## Conventions

- Each feature adds its endpoints with `api.injectEndpoints` and exports its own hooks. Import hooks from the feature's `-api.ts` file; there is no barrel.
- The active workspace id lives in `workspaceSlice`, mirrored from the `/:slug` URL. `prepareHeaders` sends it as `x-workspace-id` on every request, so endpoints never take a `workspaceId` arg.
- Login and signup seed the `getMe` cache with the returned agent, so the guards redirect off `/login` / `/signup` on their own — pages don't navigate after auth.
- A failed refresh (outside `/auth/me`) dispatches `sessionExpired`, which resets the cache so the guards send the agent to `/login`.
- `VITE_API_URL` is required (`.env.example`); the base query throws at startup without it.
- Cache keys therefore don't include the workspace: changing the active workspace resets the whole RTK Query cache (listener in `store.ts`). Workspace-scoped queries must `skip` until an active workspace is set, or the API answers 400.
