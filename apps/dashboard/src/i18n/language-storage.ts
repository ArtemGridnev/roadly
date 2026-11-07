import { languageSchema, type Language } from '@roadly/shared'

const STORAGE_KEY = 'roadly-language'

export function readStoredLanguage(): Language | null {
  try {
    const stored = languageSchema.safeParse(localStorage.getItem(STORAGE_KEY))
    return stored.success ? stored.data : null
  } catch {
    return null
  }
}

export function writeStoredLanguage(language: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Storage blocked: the choice still applies for this session.
  }
}

export function detectLanguage(): Language {
  return readStoredLanguage() ?? (navigator.language.toLowerCase().startsWith('he') ? 'he' : 'en')
}
