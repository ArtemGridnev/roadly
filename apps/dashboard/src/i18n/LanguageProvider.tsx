import { useLayoutEffect, type ReactNode } from 'react'
import { useCurrentAgentState } from '@/features/auth/api/auth-api'
import { applyLanguage } from './i18n'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: agent } = useCurrentAgentState()
  const savedLanguage = agent?.language

  useLayoutEffect(() => {
    if (savedLanguage) {
      applyLanguage(savedLanguage)
    }
  }, [savedLanguage])

  return children
}
