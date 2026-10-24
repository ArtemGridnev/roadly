# Dashboard Pages — Admin Dashboard (`apps/dashboard`)

Which pages the admin dashboard has, what each one is for, and how an `Agent` moves between them. Visual conventions (tokens, layout shell, copy) live in `ui-context.md`; this file covers structure and behavior.

---

## Routes

| Route | Page | Shell | MVP |
|---|---|---|---|
| `/login` | Sign in | Standalone | Yes |
| `/signup` | Sign up | Standalone | Yes |
| `/onboarding` | No-workspace screen | Standalone | Yes |
| `/:slug/roadmap` | Roadmap Board (kanban ⇄ table) | App shell | Yes |
| `/:slug/install` | Install widget | App shell | Yes |
| `/` | Redirect only | — | Yes |

**App shell** = fixed sidebar + top bar, per `ui-context.md` §3. **Standalone** = centered single card, no sidebar — every sidebar item needs a workspace, so it would only show dead links here.

No workspace Settings page in the MVP: workspace name and slug are fixed after creation, and workspaces can't be deleted.

---

## Route guards

Evaluated in order:

1. Not signed in → `/login` (except `/login`, `/signup`).
2. Signed in + zero workspaces → `/onboarding`.
3. Signed in + at least one workspace, visiting `/`, `/login`, `/signup` or `/onboarding` → `/:slug/roadmap` of the last-used workspace (remembered in `localStorage`), falling back to the first in the list.
4. `/:slug/*` where `slug` isn't one of the Agent's workspaces → "Workspace not found" state with a link back to their workspaces. Don't distinguish "doesn't exist" from "not a member" (matches the API's 403-not-404 rule).

The zero-workspace rule is a state, not a signup step: it also catches an Agent who signed up and left before creating one, or who was removed from their only workspace.

---

## Workspace model

- **Active workspace comes from the URL** (`/:slug/...`). The dashboard resolves the slug against the Agent's own workspace list and sends that workspace's `id` as `x-workspace-id`. Links are shareable, and two tabs can show two workspaces.
- **Creating:** one form, two fields — **name** and **slug**. Used from the no-workspace screen and from the switcher's "New workspace" item (as a dialog).
  - Slug auto-fills from the name as kebab-case and follows it while typing, **until the Agent edits the slug by hand** — then it stops following.
  - Rules: lowercase `a–z`, `0–9`, `-`; no leading/trailing/double `-`; 3–40 chars.
  - Reserved (collide with top-level routes): `login`, `signup`, `onboarding`, `api`, `new`, `settings`. Extend this list whenever a top-level route is added.
  - Taken slug → inline error suggesting a free one: "That URL is taken. Try acme-2."
  - On success → `/:slug/install`, not an empty board.
- **Editing:** none in the MVP — name and slug are fixed once created (renaming the slug would break shared links).
- **Deleting:** not in the MVP.
- **Joining:** not in the MVP — no invites and no Members page. A workspace's only member is the Agent who created it.

---

## Pages

### Sign in (`/login`)
Email + password. Link to sign up. On success, guards decide where to go.

### Sign up (`/signup`)
Name, email, password. Link to sign in. On success → signed in → `/onboarding` (via guard 2).

### No-workspace screen (`/onboarding`)
- Opens straight on the workspace form — no intro step, since creating is the only action:
  > **Create your first workspace**
  > Create one for your product to start collecting requests.
- Sign out in the footer — permanent: this page has no sidebar, so the user menu isn't reachable from here.
- Future: joining (pending invites / invite links) appears here, above the form.

### Roadmap Board (`/:slug/roadmap`)
- Kanban (Backlog / Planned / In Progress / Shipped; each column in its status color, `ui-context.md` → Status colors; columns are as tall as their content, not equal height) and table views of the same data, toggle top-right (`ui-context.md` §3).
- **Table view:** one row per request — votes, title with a one-line description, status pill, category, created date (category and date hidden below `md`). Read-only; clicking a row opens the drawer (step 4). Same data and sort as the board; the status filter is multi-select (all on by default) and filters on the client. A filter that hides everything shows "No requests with these statuses." + **Show all statuses**.
- View, sort and status filter live in `roadmapSlice`: they survive leaving and coming back, not a full reload.
- **Narrow screens:** only the page card's body scrolls (sideways and down), never the page. Below `lg` the board snaps column by column; below `md` each column is the viewport width minus 5rem so the next one peeks in. Snapping is off while a card is dragged so edge auto-scroll works. Below `sm` the top-bar controls are icon-only. On phones drag is a bonus, not the path — status changes through the drawer.
- Drag a card between columns to change status (mouse, touch after a 250ms press, or keyboard: space to pick up, ←/→ between columns, space to drop, escape to cancel; screen reader announcements use the request title and column name). Only the status changes: the card lands where the current sort puts it, and there's no manual order within a column (no position field).
- The move shows at once; if the API rejects it the card returns to its column and an error toast says `Couldn't move "<title>" to <column>` — no retry button; dragging again is the retry.
- **Card** mirrors the widget's `RequestCard`: vote count, title, 2-line description preview, then category and created date. No status badge on kanban cards — the column already says it; the table view carries a status column. The vote count is read-only — Agents don't vote.
- **Top bar (MVP):** page controls go in `PageContent`'s `actions`, top-right of the page's top bar. Only what `GET /feature-requests` supports — sort (Most voted / Newest) and, in table view, a status filter (kanban columns already split by status). No search and no category filter until the API supports them; this narrows the `ui-context.md` §3 top bar for the MVP.
- **Drawer:** clicking a request opens the right slide-in drawer over the board. It isn't addressable by URL in the MVP — a reload closes it. In the drawer the Agent can:
  - edit title, description and category;
  - change status (the non-drag path);
  - delete the request, behind a confirmation. Author and votes are read-only.
- Empty board (no requests at all) → one line + **Install the widget** to `/:slug/install`. An empty column shows "No requests".
- Sort defaults to Most voted.

### Install widget (`/:slug/install`)
- Shows a copyable snippet carrying the workspace's `widgetKey`: a `#roadly` container, the `<script>` loading the widget bundle (`VITE_WIDGET_URL`), and `Roadly.init({ ... })` with the real key, `currentUser.*` placeholders for the host's signed-in user, and `theme: 'auto'`.
- One Copy button on the snippet ("Copied" for ~2s); three short steps link on to the Roadmap. No separate key display — the snippet is the only install path; add one if a non-snippet integration (npm package, key rotation) lands.
- Landing page right after creating a workspace.

---

## Sidebar

Top to bottom:

0. **Roadly mark** (tile only, no wordmark) — on the same row as the switcher, to its left; not inside it.
1. **Workspace switcher** — current workspace name; dropdown lists the Agent's workspaces in API (creation) order, checkmark on the active one, and a **New workspace** item.
   - Picking one → its `/:slug/roadmap`; on mobile the sheet closes.
   - **New workspace** opens a dialog with the same create form as onboarding. Success closes the dialog and goes to `/:slug/install` (a normal history entry, unlike onboarding's replace). Errors stay inside the dialog.
   - Switching keeps the shell mounted: only the page area waits for the new workspace.
2. **Roadmap**
3. **Install**
4. *(footer)* **User menu** — Agent name/email, sign out. Account only — no app preferences here.

A **Theme** row (light / dark / system) sits in the sidebar footer above the user menu — not inside it; it moves to a Settings page once one exists.

Built on shadcn/ui's `Sidebar`. On mobile it's hidden behind a menu button in the top bar and slides in as a sheet; on desktop it's fixed.

---

## API work this needs

Built:

- `POST /auth/signup` (public) — creates the Agent and signs them in (same cookies and response as `/auth/login`); 409 on a registered email. The `/agents` routes are removed.
- `GET /auth/me` — current Agent; 401 if the session is dead. The dashboard calls it on load; on a 401 the base query tries `/auth/refresh` once, then the guard sends the Agent to `/login`. Never call `/auth/refresh` just to check who's signed in — refresh tokens are single-use, so two tabs doing it at once would sign one out.
- `POST /auth/logout` (public) — revokes the refresh token and clears both cookies; always 204, even with an expired or missing session.
- `GET /workspaces` returns only the Agent's own workspaces. `GET/PATCH/DELETE /workspaces/:id` are removed (unscoped, and the MVP has no workspace edit or delete).
- `POST /workspaces` adds the creator as a `WorkspaceMember` in the same create; validates slug format, length and reserved words (400) and uniqueness (409).
- `POST /feature-requests` takes no `authorId` — Agent-created requests have no Contact author (`authorId: null`) and start at 0 votes.
- Admin vote routes are removed — Agents don't vote.
- `/workspace-members` is read-only (list, get); adding/removing members is removed until joining exists. The creator is a workspace's only member.
- Signup requires a password of 8+ characters with a lowercase letter, an uppercase letter and a digit (shared `createAgentSchema`). Rate limits: login 5/min per IP+email, signup 10/hour per IP.

---

## Not in the MVP

- Stats row (summary numbers above the board). `ui-context.md`'s 32px size stays reserved for it and goes unused until then.
- Search and category filter (need API support first).
- Members page and joining a workspace.
- Workspace Settings, renaming, deleting.
- Addressable drawer URLs.
