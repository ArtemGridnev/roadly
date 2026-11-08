import { useMutation } from '@tanstack/react-query'
import type { CreateContactInput, WidgetSession } from '@roadly/shared'
import { apiRequest, type RequestSession } from './client'

export interface SessionClient extends RequestSession {
  refresh: () => Promise<WidgetSession>
}

export function createSessionClient(widgetKey: string, identity: CreateContactInput): SessionClient {
  let sessionToken: string | null = null
  let refreshing: Promise<WidgetSession> | null = null

  return {
    token: () => sessionToken,
    refresh: () => {
      refreshing ??= apiRequest<WidgetSession>('/widget/session/unsigned', {
        method: 'POST',
        body: identity,
        widgetKey,
      })
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

export function useIdentify() {
  return useMutation({
    mutationFn: (session: SessionClient) => session.refresh(),
  })
}
