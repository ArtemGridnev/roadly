import type { FeatureRequest } from '@roadly/shared'
import { StatusBadge } from '../ui/StatusBadge'
import { VoteCount } from '../ui/VoteCount'
import { formatRequestDate } from '../../lib/format-date'

interface RequestCardProps {
  request: FeatureRequest
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <li className="flex gap-3 rounded-lg border border-border bg-card p-4">
      <VoteCount count={request.voteCount} />

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-card-foreground">{request.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={request.status} />
          {request.category ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {request.category}
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {formatRequestDate(request.createdAt)}
          </span>
        </div>
      </div>
    </li>
  )
}
