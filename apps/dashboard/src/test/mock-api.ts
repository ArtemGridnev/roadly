export interface MockResponse {
  status: number
  body?: unknown
}

type Handler = (body: unknown) => MockResponse

export function mockApi(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (request: Request) => {
    const route = `${request.method} ${new URL(request.url).pathname}`
    const handler = handlers[route]

    if (!handler) {
      throw new Error(`Unhandled request: ${route}`)
    }

    const text = await request.text()
    const { status, body } = handler(text ? JSON.parse(text) : undefined)

    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}
