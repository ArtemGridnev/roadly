import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  value: string
  label: string
}

type CopyState = 'idle' | 'copied' | 'failed'

export function CopyButton({ value, label }: CopyButtonProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {state === 'copied' ? <Check /> : <Copy />}
      <span aria-live="polite">
        {state === 'copied' ? t('install.copied') : state === 'failed' ? t('install.copyFailed') : t('install.copy')}
      </span>
      <span className="sr-only">{label}</span>
    </Button>
  )
}
