import type { FeatureRequest } from '@roadly/shared'
import { ArrowBigUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatRequestDate } from '@/lib/format-date'
import { cn } from '@/lib/utils'

interface BoardCardProps {
  request: FeatureRequest
  className?: string
}

export function BoardCard({ request, className }: BoardCardProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className={cn('flex gap-3 rounded-lg border bg-card p-3 text-start', className)}>
      <div
        aria-label={t('common.votes', { count: request.voteCount })}
        className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
      >
        <ArrowBigUp aria-hidden="true" className="size-4" />
        <span className="text-xs font-medium">{request.voteCount}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 dir="auto" className="text-sm font-semibold">{request.title}</h3>
        <p dir="auto" className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">{formatRequestDate(request.createdAt, i18n.language)}</p>
      </div>
    </div>
  )
}
