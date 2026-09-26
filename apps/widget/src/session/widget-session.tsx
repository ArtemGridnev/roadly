import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Contact, RoadlyInitOptions } from '@roadly/shared'
import { useIdentifyContact } from '../api/contacts'

interface WidgetSessionValue {
  widgetKey: RoadlyInitOptions['widgetKey']
  contact: Contact | null
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
  const [contact, setContact] = useState<Contact | null>(null)
  const identifyContact = useIdentifyContact()
  const { mutate } = identifyContact

  useEffect(() => {
    mutate(
      { widgetKey, input: { externalId: user.id, name: user.name, email: user.email } },
      { onSuccess: setContact },
    )
  }, [mutate, widgetKey, user.id, user.name, user.email])

  return (
    <WidgetSessionContext.Provider
      value={{
        widgetKey,
        contact,
        isIdentifying: identifyContact.isPending,
        identifyError: identifyContact.error,
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
