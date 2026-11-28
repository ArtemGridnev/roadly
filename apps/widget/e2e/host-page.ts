import { resolve } from 'node:path'
import type { Page, Request } from '@playwright/test'
import type { RoadlyInitOptions, WidgetSession } from '@roadly/shared'

export const API_URL = 'http://api.test'
export const BUNDLE_DIR = resolve(import.meta.dirname, 'dist')
const HOST_URL = 'http://host.test/'

declare global {
  interface Window {
    Roadly: { init: (options: RoadlyInitOptions) => void; shutdown: () => void }
  }
}

// Host rules that would restyle the widget if they reached it, and a Tailwind class name the widget's CSS would restyle if it leaked out.
const HOST_HTML = `<!doctype html>
<html>
  <head>
    <style>
      button { background: rgb(255, 0, 0) !important; border-radius: 0 !important; }
    </style>
  </head>
  <body>
    <p class="hidden">Host paragraph</p>
    <div id="widget-container"></div>
    <script src="/widget.js"></script>
  </body>
</html>`

export interface MockResponse {
  status: number
  body?: unknown
}

type Handler = (request: Request) => MockResponse

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE',
  'access-control-allow-headers': 'authorization, content-type, x-widget-key',
}

export async function openHostPage(page: Page, handlers: Record<string, Handler>) {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  )
  await page.route(`${HOST_URL}widget.js`, (route) => route.fulfill({ path: resolve(BUNDLE_DIR, 'widget.js') }))
  await page.route(HOST_URL, (route) => route.fulfill({ contentType: 'text/html', body: HOST_HTML }))
  await page.route(`${API_URL}/**`, (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS })
    }

    const path = `${request.method()} ${new URL(request.url()).pathname}`
    const handler = handlers[path]
    if (!handler) {
      throw new Error(`Unhandled request: ${path}`)
    }

    const { status, body } = handler(request)
    return route.fulfill({ status, headers: CORS_HEADERS, json: body })
  })

  await page.goto(HOST_URL)
}

export const unsignedUser = { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' }

export const widgetSession = (): MockResponse => ({
  status: 201,
  body: { sessionToken: 'session-1', contactId: 'contact-1' } satisfies WidgetSession,
})
