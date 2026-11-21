import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { RoadlyInitOptions } from '@roadly/shared'
import type { SessionClient } from '../api/session'

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
  session: SessionClient
  children: ReactNode
}

export function WidgetSessionProvider({ widgetKey, session, children }: WidgetSessionProviderProps) {
  const [contactId, setContactId] = useState<string>()
  const [identifyError, setIdentifyError] = useState<unknown>(null)

  useEffect(() => {
    let isCurrent = true

    session.refresh().then(
      ({ contactId }) => {
        if (isCurrent) setContactId(contactId)
      },
      (error: unknown) => {
        if (isCurrent) setIdentifyError(error)
      },
    )

    return () => {
      isCurrent = false
    }
  }, [session])

  return (
    <WidgetSessionContext.Provider
      value={{
        widgetKey,
        session,
        contactId,
        isIdentifying: !contactId && !identifyError,
        identifyError,
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
