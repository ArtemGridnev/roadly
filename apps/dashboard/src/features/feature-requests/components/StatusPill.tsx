import type { RequestStatus } from '@roadly/shared'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { STATUS_META } from '../constants/request-status'

export function StatusPill({ status }: { status: RequestStatus }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_META[status].pillClassName,
      )}
    >
      {t(`status.${status}`)}
    </span>
  )
}
