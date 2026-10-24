export interface MockResponse {
  status: number
  body?: unknown
}

type Handler = (body: unknown, url: URL) => MockResponse

export function mockApi(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (request: Request) => {
    const url = new URL(request.url)
    const route = `${request.method} ${url.pathname}`
    const handler = handlers[route]

    if (!handler) {
      throw new Error(`Unhandled request: ${route}`)
    }

    const text = await request.text()
    const { status, body } = handler(text ? JSON.parse(text) : undefined, url)

    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}
