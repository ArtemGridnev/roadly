import { createContext, useContext } from 'react'
import type { Language } from '@roadly/shared'
import { en, type Messages } from './locales/en'
import { he } from './locales/he'

const MESSAGES: Record<Language, Messages> = { en, he }

export const LanguageContext = createContext<Language>('en')

export function useLanguage() {
  const language = useContext(LanguageContext)

  return { language, dir: language === 'he' ? 'rtl' : 'ltr', t: MESSAGES[language] } as const
}
