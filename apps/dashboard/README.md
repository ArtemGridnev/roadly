# @roadly/dashboard

Authenticated admin dashboard. The product team triages Feature Requests and manages the Roadmap Board.

In progress — see `context/architecture.md` for the intended stack (React + Redux Toolkit/RTK Query, Vite SPA, shadcn/ui + Radix + Tailwind, dnd-kit, @tanstack/react-table) and `context/dashboard-pages.md` for pages and routes. Scaffold, theme provider, store, RTK Query layer, routing with auth guards, and the sign-up page exist.

## Folder structure

| Path | Holds |
|---|---|
| `src/main.tsx`, `src/App.tsx` | Entry point and app root (Redux `Provider`, `RouterProvider`) |
| `src/routes.tsx` | Route tree; guards are layout routes |
| `src/components/` | App-level components (`StandaloneLayout`, `AppLayout`, `PageContent`, `FormField`, `LoadError`); shadcn source in `ui/` |
| `src/index.css` | Tailwind entry; imports `@roadly/shared/tokens.css` |
| `src/theme/` | `ThemeProvider` / `useTheme` — light, dark, system |
| `src/lib/` | Small shared helpers (`cn`, field ids) |
| `src/test/` | Vitest setup, `mockApi` (stubs `fetch` by `METHOD /path`), `renderApp` (real routes in a memory router, fresh store) |
| `src/store.ts` | `makeStore()` factory, app `store`, `RootState`, `AppDispatch` |
| `src/api/` | Base `createApi` (no endpoints), reauth base query, `getErrorStatus` |
| `src/features/<feature>/` | Everything for one feature, split by kind (see below) |
| `src/features/auth/` | Login, signup, `getMe`; `RequireAgent` and `GuestOnly` guards |
| `src/features/workspaces/` | List and create workspaces; `store/workspace-slice.ts` holds the active workspace id; `WorkspaceRedirect` (zero workspaces → `/onboarding`) |
| `src/features/roadmap/` | Roadmap Board: columns, cards, sort menu; `store/roadmap-slice.ts` holds the sort |
| `src/features/install/` | Install page: embed snippet, `CopyButton` |
| `src/features/feature-requests/` | List, update (optimistic), delete feature requests |

Inside a feature, files go in a folder by kind. Only create a folder when the feature has a file for it; tests sit next to the file they test.

| Folder | Holds |
|---|---|
| `api/` | `<feature>-api.ts` — the feature's `injectEndpoints` and hooks |
| `pages/` | Route elements (`*Page.tsx`) |
| `guards/` | Layout routes that redirect or gate (`Require*`, `GuestOnly`, `WorkspaceRoute`) |
| `components/` | Everything else React that the feature's pages and guards use |
| `hooks/` | `use-*.ts` |
| `store/` | Redux slices (`*-slice.ts`) |
| `utils/` | Pure helpers |
| `constants/` | Fixed values and label maps |

## Conventions

- `AppLayout` is only the shell (sidebar + inset card). Every `/:slug` page renders its own top bar and body through `<PageContent title actions? className?>` — it carries the mobile "Open menu" button, so a page without it has no menu on mobile. Page layout decisions (padding, width) stay in the page via `className`.
- Each feature adds its endpoints with `api.injectEndpoints` and exports its own hooks. Import hooks from the feature's `api/<feature>-api.ts` file; there is no barrel.
- The active workspace id lives in `workspaceSlice`, mirrored from the `/:slug` URL. `prepareHeaders` sends it as `x-workspace-id` on every request, so endpoints never take a `workspaceId` arg.
- Login and signup seed the `getMe` cache with the returned agent, so the guards redirect off `/login` / `/signup` on their own — pages don't navigate after auth.
- A failed refresh (outside `/auth/me`) dispatches `sessionExpired`, which resets the cache so the guards send the agent to `/login`.
- `VITE_API_URL` is required (`.env.example`); the base query throws at startup without it. `VITE_WIDGET_URL` (the hosted widget bundle, shown in the Install snippet) is required the same way.
- Cache keys therefore don't include the workspace: changing the active workspace resets the whole RTK Query cache (listener in `store.ts`). Workspace-scoped queries must `skip` until an active workspace is set, or the API answers 400.
