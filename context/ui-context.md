# UI Context — Feature Request & Roadmap Board

Conventions for all UI in this project. **Read before adding or changing UI.** The point is to prevent drift toward framework defaults — when a choice below conflicts with what a library ships by default, this doc wins.

---

## Hard rules (don't violate without updating this doc)

- Icons: **lucide-react only.** Never Material Icons or Font Awesome.
- Neutrals: **Tailwind `zinc` scale only.** Never mix `gray` / `slate` into the same view.
- Radius: **`rounded-lg` (8px) everywhere.** No mixed radii. Exception: status badges are `rounded-full`.
- Elevation: static cards use a **border, not a shadow.** `shadow-sm` only on floating surfaces (modal, dropdown, popover).
- Brand color lives in shadcn's **`--primary`**, not `--accent`. `--accent` keeps shadcn's meaning (subtle hover surface).
- **Dark mode is supported.** Both light and dark token sets are defined below. Any new color token must be added to *both* `:root` and `.dark` — never leave one half-defined. Toggle mechanism in §2.
- Widget bundle is size-sensitive — see §5 before adding a dependency to it.

---

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Components | shadcn/ui | Lives in `src/components/ui`, owned source — edit directly, don't wrap in overrides |
| Primitives | Radix UI | Ships under shadcn; source of a11y (focus, ARIA) |
| Styling | Tailwind CSS | Utilities only. No CSS-in-JS, no styled-components |
| Icons | lucide-react | Single icon set |
| Animation | Framer Motion + tailwindcss-animate | Framer for orchestrated (drawer, modal); tailwindcss-animate for simple enter/exit (dropdown, accordion) |
| Toasts | sonner | Bottom-right |

---

## 2. Tokens

### shadcn CSS variables (drop into `globals.css`)
HSL, space-separated, referenced as `hsl(var(--x))`. Values chosen below; hex source of truth in comments.

```css
:root {
  --background: 0 0% 98%;         /* #FAFAFA — page bg, not pure white */
  --foreground: 240 6% 10%;       /* zinc-900 — primary text */
  --card: 0 0% 100%;              /* #FFFFFF */
  --card-foreground: 240 6% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 6% 10%;
  --primary: 239 84% 67%;         /* indigo-500 #6366F1 — BRAND: actions, links, active */
  --primary-foreground: 0 0% 100%;
  --secondary: 240 5% 96%;        /* zinc-100 */
  --secondary-foreground: 240 6% 10%;
  --muted: 240 5% 96%;            /* zinc-100 */
  --muted-foreground: 240 4% 46%; /* zinc-500 — secondary text, captions */
  --accent: 240 5% 96%;           /* zinc-100 — subtle hover surface (shadcn meaning) */
  --accent-foreground: 240 6% 10%;
  --border: 240 6% 90%;           /* zinc-200 — hairline separation */
  --input: 240 6% 90%;
  --ring: 239 84% 67%;            /* focus ring = brand */
  --destructive: 0 72% 51%;       /* red-600 — form errors */
  --radius: 0.5rem;               /* 8px — defined once, shared by both themes */
}

.dark {
  --background: 240 10% 4%;       /* zinc-950 #09090B */
  --foreground: 0 0% 98%;         /* zinc-50 */
  --card: 240 6% 10%;             /* zinc-900 — one step up from bg for elevation */
  --card-foreground: 0 0% 98%;
  --popover: 240 6% 10%;
  --popover-foreground: 0 0% 98%;
  --primary: 239 84% 67%;         /* indigo-500 — brand holds across themes */
  --primary-foreground: 0 0% 100%;
  --secondary: 240 4% 16%;        /* zinc-800 */
  --secondary-foreground: 0 0% 98%;
  --muted: 240 4% 16%;            /* zinc-800 */
  --muted-foreground: 240 5% 65%; /* zinc-400 — lighter for contrast on dark */
  --accent: 240 4% 16%;           /* zinc-800 — subtle hover surface */
  --accent-foreground: 0 0% 98%;
  --border: 240 4% 16%;           /* zinc-800 — lighter than bg in dark */
  --input: 240 4% 16%;
  --ring: 239 84% 67%;
  --destructive: 0 91% 71%;       /* red-400 — lighter for contrast on dark */
}
```
> On Tailwind v4 / newest shadcn the format is OKLCH instead of HSL — convert from the hex in the comments if so. Meaning of each variable is unchanged.

**Toggle:** Tailwind `darkMode: 'class'` in config; toggle the `.dark` class on `<html>`. Use a small theme provider that persists the choice to `localStorage` and falls back to `prefers-color-scheme` on first load. (No `next-themes` — this is a Vite SPA, not Next.) Offer three states — light / dark / system — not a bare two-way switch.

### Status colors
Render as pill: `rounded-full` + the Tailwind class pair below. Don't hand-roll hexes.

Matches the canonical `Status` enum in `CONTEXT.md` — do not add, rename, or reorder without updating the enum there first.

| Status | Classes |
|---|---|
| Backlog | `bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300` |
| Planned | `bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300` |
| In Progress | `bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300` |
| Shipped | `bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300` |

### Typography
- Font: **Inter** (`@fontsource/inter` or self-hosted), fallback `system-ui`.
- Scale — use only these: **12 / 14 / 16 / 20 / 24 / 32px.**
  - 12 → captions, badges, timestamps
  - 14 → body default, table cells, form labels
  - 16 → section headers, modal titles
  - 20–24 → page titles
  - 32 → dashboard stat numbers only
- Weights: **400** body · **500** labels & buttons · **600** headings. Don't use 700+.

### Spacing
- 4px base (Tailwind default scale).
- Card padding: `p-4` mobile → `p-6` desktop.
- Gaps: `gap-6` between major blocks · `gap-2`/`gap-3` within a tight cluster (avatar + name).

---

## 3. Layout — admin dashboard

- Fixed left sidebar (~240px) + main content.
- Top bar inside main content: search · filter dropdown · primary CTA (top-right).
- Single feature request opens in a **right slide-in drawer**, not a full-page route — keeps the list in context behind it.
- Roadmap Board offers **kanban and table views** of the same data; toggle top-right of the board.
- Empty states: one line of direction + one primary CTA. Never bare "No data".

---

## 4. Copy (small, but it's what stops it feeling templated)

- Buttons name the action and keep that name through the flow: `Publish` → toast `Published`. Not `Submit`.
- Sentence case, active voice, plain verbs. Name things by what the user controls, not the system's internals.
- Errors say what happened and how to fix it. No apologies, no vagueness.

---

## 5. Widget vs admin dashboard — where they diverge

The embeddable widget is a separate, lighter surface. It must NOT inherit the full admin visual weight.

| | Admin dashboard | Embeddable widget |
|---|---|---|
| Layout | Sidebar + top bar + drawer | Single column, no sidebar — sits inside a host page |
| Components | Full shadcn set | List, form, button, badge only. No heavy modals — inline expand or lightweight popover |
| Theming | Fixed to tokens above | Expose a small set of overridable CSS vars (accent, radius) so host apps can reskin. **This is the one place tokens are not hardcoded.** |
| Deps | Use the stack freely | Size-sensitive — prefer a plain CSS transition over pulling Framer Motion in if it does the job |
| Font | Inter | Inherit host page font; fall back to Inter only if none set |
| Dark mode | User-facing toggle (light / dark / system) | Optional `theme: 'light' \| 'dark' \| 'auto'` in the `init` call. Defaults to `'auto'` → follows host `prefers-color-scheme`. No user-facing toggle inside the widget; the host decides |

**Rule of thumb:** admin-only component → full stack. Shared with or living in the widget → lightest option that still looks intentional.

---

*Reflects the current phase: MVP, unverified widget identity, pre-comments/roles.*