import type { Language } from '@roadly/shared'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCurrentAgentState, useUpdateCurrentAgentMutation } from '@/features/auth/api/auth-api'
import { applyLanguage } from './i18n'

export function useLanguage() {
  const { t, i18n } = useTranslation()
  const { data: agent } = useCurrentAgentState()
  const [updateCurrentAgent] = useUpdateCurrentAgentMutation()
  const language = i18n.language as Language

  async function setLanguage(next: Language) {
    applyLanguage(next)

    if (!agent) {
      return
    }

    try {
      await updateCurrentAgent({ language: next }).unwrap()
    } catch {
      applyLanguage(language)
      toast.error(t('settings.languageSaveFailed'))
    }
  }

  return { language, setLanguage }
}
