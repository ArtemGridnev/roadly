import type { WidgetFeatureRequest } from '@roadly/shared'
import { StatusBadge } from '../ui/StatusBadge'
import { formatRequestDate } from '../../lib/format-date'

interface RequestMetaProps {
  request: WidgetFeatureRequest
}

export function RequestMeta({ request }: RequestMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={request.status} />
      {request.category ? (
        <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {request.category}
        </span>
      ) : null}
      <span className="text-xs text-muted-foreground">{formatRequestDate(request.createdAt)}</span>
    </div>
  )
}
