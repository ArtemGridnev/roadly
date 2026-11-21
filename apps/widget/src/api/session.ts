import type { CreateContactInput, WidgetSession } from '@roadly/shared'
import { apiRequest, type RequestSession } from './client'

export interface SessionClient extends RequestSession {
  refresh: () => Promise<WidgetSession>
}

export type SessionIdentity =
  | { kind: 'signed'; getToken: () => Promise<string> }
  | { kind: 'unsigned'; contact: CreateContactInput }

async function createSession(widgetKey: string, identity: SessionIdentity): Promise<WidgetSession> {
  if (identity.kind === 'unsigned') {
    return apiRequest<WidgetSession>('/widget/session/unsigned', {
      method: 'POST',
      body: identity.contact,
      widgetKey,
    })
  }

  return apiRequest<WidgetSession>('/widget/session/signed', {
    method: 'POST',
    body: { token: await identity.getToken() },
    widgetKey,
  })
}

export function createSessionClient(widgetKey: string, identity: SessionIdentity): SessionClient {
  let sessionToken: string | null = null
  let refreshing: Promise<WidgetSession> | null = null

  return {
    token: () => sessionToken,
    refresh: () => {
      refreshing ??= createSession(widgetKey, identity)
        .then((session) => {
          sessionToken = session.sessionToken
          return session
        })
        .finally(() => {
          refreshing = null
        })

      return refreshing
    },
  }
}
