const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface RequestSession {
  token: () => string | null
  refresh: () => Promise<unknown>
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  widgetKey: string
  session?: RequestSession
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, widgetKey, session }: ApiRequestOptions,
): Promise<T> {
  const send = () => {
    const headers: Record<string, string> = {
      'x-widget-key': widgetKey,
    }

    const sessionToken = session?.token()
    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let response = await send()

  if (response.status === 401 && session) {
    await session.refresh()
    response = await send()
  }

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} failed with ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
