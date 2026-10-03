# Roadly Widget

The embeddable, unauthenticated end-user surface. Built with Vite in library mode to a single
self-mounting IIFE bundle (`dist/widget.js`) that a host app loads and initializes:

```html
<script src="https://cdn.example.com/widget.js"></script>
<script>
  Roadly.init({
    container: '#roadly',
    widgetKey: 'wk_...',
    user: { id: 'u_1', name: 'Jane Doe', email: 'jane@example.com' },
    theme: 'auto',
  })
</script>
```

Run `pnpm dev` and open the dev harness (`index.html`) to work on it against a real host page.

## Folder structure

| Path | Holds |
|---|---|
| `src/widget.tsx` | Entry point: validates host options, mounts the shadow root, wires providers |
| `src/shadow/` | Shadow-root mounting and the document-scoped style installation below |
| `src/app/` | `WidgetRoot` — launcher/panel open state and resolved theme |
| `src/components/launcher/` | The floating launcher button |
| `src/components/layout/` | Panel shell, header, bottom tab bar, tab definitions |
| `src/components/requests/` | Feature request card, list, loading skeleton, sort toggle |
| `src/components/new-request/` | Submit form and the overlay that floats it over the panel |
| `src/components/ui/` | Hand-styled primitives (button, badge, skeleton, state message, form fields) |
| `src/views/` | One component per tab, binding a query to a list |
| `src/api/` | TanStack Query hooks and the fetch client |
| `src/session/` | Contact identification from the host-supplied user |
| `src/theme/` | `theme` option → resolved `light` / `dark` |
| `src/lib/` | Small shared helpers (`cn`, date formatting) |

## Shadow DOM

Everything renders inside a shadow root so the host page cannot style the widget and the widget
cannot leak styles out. Three consequences shape the code:

**Tailwind is injected into the shadow root, not `document.head`.** `src/index.css` is imported
with `?inline` and mounted as a `<style>` inside the shadow tree. Tailwind v4 emits its theme
variables on `:root, :host`, so the tokens resolve against the host element.

**`@font-face` and `@property` are hoisted to `document.head`.** Both at-rules only register
document-wide — a browser ignores them inside a shadow root. For `@property` this is not
cosmetic: Tailwind v4 compiles `.border` to `border-style: var(--tw-border-style)`, so without
the registration every border on every element silently disappears.
`src/shadow/install-document-styles.ts` extracts the `@property` rules from the compiled CSS and
appends them, plus the Inter stylesheet link, to `document.head` (idempotently, so several widget
instances on one page install them once).

**Radix portalling components must set `container`** to an element inside the shadow root. The
tab bar uses `@radix-ui/react-tabs`, which does not portal; the first dropdown/popover/tooltip
added here must pass `container` explicitly or it will render unstyled outside the shadow tree.

## Theming

Tokens follow `context/ui-context.md`, expressed as Tailwind v4 `@theme` variables in
`src/index.css`. Dark mode cannot use a class on `<html>` — that element is outside the shadow
tree — so `WidgetRoot` stamps `data-roadly-theme="light|dark"` on the widget's own root element,
and a `@custom-variant dark` keys the `dark:` utilities off it.

Per `ui-context.md` §5 the widget is the one surface whose tokens are not fully hardcoded. A host
app can override three variables on the container element:

| Variable | Default |
|---|---|
| `--roadly-primary` | indigo-500 |
| `--roadly-radius` | `0.5rem` |
| `--roadly-font-family` | `'Inter', ui-sans-serif, system-ui, …` |

Inter is loaded from the Google Fonts CDN rather than bundled: the widget is size-sensitive, and
inlining three weights as base64 would add ~115 kB to a 91 kB (gzipped) bundle. If a host page's
CSP blocks the stylesheet, the widget falls back to the host's system font stack.

## Conventions

- Radix primitives + Tailwind, hand-styled. No shadcn/ui, no dashboard imports.
- TanStack Query owns server state; no Redux.
- List surfaces route loading / empty / error through `RequestList`, which renders a skeleton, a
  `StateMessage` with a retry action, or an empty state with copy supplied by the calling view.
- The submit form is an overlay inside the panel (`NewRequestOverlay`), not a tab or a modal: it
  covers the list and tab bar, the background is `inert` while it is open, Escape or the back arrow
  closes it, and focus returns to the "New request" button. On success it switches to My requests,
  where the new request appears first.
