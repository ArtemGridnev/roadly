import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface LoadErrorProps {
  onRetry: () => void
}

export function LoadError({ onRetry }: LoadErrorProps) {
  const { t } = useTranslation()

  return (
    <div role="alert" className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">
        {t('common.loadError')}
      </p>
      <Button variant="outline" onClick={onRetry}>
        {t('common.tryAgain')}
      </Button>
    </div>
  )
}
