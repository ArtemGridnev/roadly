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
- One line of direction, one primary CTA (`ui-context.md` §3):
  > You're not in a workspace yet. Create one for your product to start collecting requests.
  >
  > **[ Create workspace ]**
- Create opens the workspace form.
- Future: joining (pending invites / invite links) appears here, above the CTA.

### Roadmap Board (`/:slug/roadmap`)
- Kanban (Backlog / Planned / In Progress / Shipped) and table views of the same data, toggle top-right (`ui-context.md` §3).
- Drag a card between columns to change status.
- **Card** mirrors the widget's `RequestCard`: vote count, title, 2-line description preview, then status badge, category and created date. The vote count is read-only — Agents don't vote. Table columns carry the same fields.
- **Top bar (MVP):** only what `GET /feature-requests` supports — sort (Most voted / Newest) and, in table view, a status filter (kanban columns already split by status). No search and no category filter until the API supports them; this narrows the `ui-context.md` §3 top bar for the MVP.
- **Drawer:** clicking a request opens the right slide-in drawer over the board. It isn't addressable by URL in the MVP — a reload closes it. In the drawer the Agent can:
  - edit title, description and category;
  - change status (the non-drag path);
  - delete the request, behind a confirmation. Author and votes are read-only.
- Empty state points to `/:slug/install`.

### Install widget (`/:slug/install`)
- Shows the workspace's `widgetKey` and a copyable `Roadly.init({ ... })` snippet.
- Landing page right after creating a workspace.

---

## Sidebar

Top to bottom:

1. **Workspace switcher** — current workspace name; dropdown lists the Agent's workspaces (checkmark on the active one) and a **New workspace** item.
2. **Roadmap**
3. **Install**
4. *(footer)* **User menu** — Agent name/email, theme toggle (light / dark / system), sign out.

---

## API work this needs

Not built yet; each is a prerequisite for the page that uses it.

- `POST /workspaces` adds the creator as a `WorkspaceMember` in the same transaction; validates slug format, reserved words and uniqueness (409 on a taken slug).
- `GET /workspaces` returns only the current Agent's workspaces — today it lists every workspace in the system.
- `GET /auth/me` — current Agent, so the dashboard can restore the session after a reload.
- Logout endpoint that revokes the refresh token.

---

## Not in the MVP

- Stats row (summary numbers above the board). `ui-context.md`'s 32px size stays reserved for it and goes unused until then.
- Search and category filter (need API support first).
- Members page and joining a workspace.
- Workspace Settings, renaming, deleting.
- Addressable drawer URLs.
