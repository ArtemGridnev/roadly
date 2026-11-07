import { Direction } from 'radix-ui'
import { useLayoutEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentAgentState } from '@/features/auth/api/auth-api'
import { applyLanguage } from './i18n'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { data: agent } = useCurrentAgentState()
  const savedLanguage = agent?.language

  useLayoutEffect(() => {
    if (savedLanguage) {
      applyLanguage(savedLanguage)
    }
  }, [savedLanguage])

  return <Direction.Provider dir={i18n.dir()}>{children}</Direction.Provider>
}
