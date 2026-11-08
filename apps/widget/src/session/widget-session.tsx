import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RoadlyInitOptions } from '@roadly/shared'
import { createSessionClient, useIdentify, type SessionClient } from '../api/session'

interface WidgetSessionValue {
  widgetKey: RoadlyInitOptions['widgetKey']
  session: SessionClient
  contactId: string | undefined
  isIdentifying: boolean
  identifyError: unknown
}

const WidgetSessionContext = createContext<WidgetSessionValue | null>(null)

interface WidgetSessionProviderProps {
  widgetKey: RoadlyInitOptions['widgetKey']
  user: RoadlyInitOptions['user']
  children: ReactNode
}

export function WidgetSessionProvider({ widgetKey, user, children }: WidgetSessionProviderProps) {
  const [contactId, setContactId] = useState<string>()
  const session = useMemo(
    () =>
      createSessionClient(widgetKey, {
        externalId: user.id,
        name: user.name,
        email: user.email,
      }),
    [widgetKey, user.id, user.name, user.email],
  )
  const identify = useIdentify()
  const { mutate } = identify

  useEffect(() => {
    mutate(session, { onSuccess: ({ contactId }) => setContactId(contactId) })
  }, [mutate, session])

  return (
    <WidgetSessionContext.Provider
      value={{
        widgetKey,
        session,
        contactId,
        isIdentifying: identify.isPending,
        identifyError: identify.error,
      }}
    >
      {children}
    </WidgetSessionContext.Provider>
  )
}

export function useWidgetSession(): WidgetSessionValue {
  const session = useContext(WidgetSessionContext)

  if (!session) {
    throw new Error('useWidgetSession must be used within a WidgetSessionProvider')
  }

  return session
}
