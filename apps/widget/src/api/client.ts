const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  widgetKey: string
  contactId?: string
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, widgetKey, contactId }: ApiRequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    'x-widget-key': widgetKey,
  }

  if (contactId) {
    headers['x-contact-id'] = contactId
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}
