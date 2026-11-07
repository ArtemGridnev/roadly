import type { WidgetFeatureRequest } from '@roadly/shared'
import { useLanguage } from '../../i18n/use-language'
import { StatusBadge } from '../ui/StatusBadge'
import { formatRequestDate } from '../../lib/format-date'

interface RequestMetaProps {
  request: WidgetFeatureRequest
}

export function RequestMeta({ request }: RequestMetaProps) {
  const { language } = useLanguage()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={request.status} />
      <span className="text-xs text-muted-foreground">{formatRequestDate(request.createdAt, language)}</span>
    </div>
  )
}
