import type { Language } from '@roadly/shared'
import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { detectLanguage, writeStoredLanguage } from './language-storage'
import { en } from './locales/en'
import { he } from './locales/he'

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  he: 'עברית',
}

export const i18n = createInstance()

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
  document.documentElement.dir = i18n.dir(language)
})

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, he: { translation: he } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
})

export function applyLanguage(language: Language) {
  writeStoredLanguage(language)
  i18n.changeLanguage(language)
}
