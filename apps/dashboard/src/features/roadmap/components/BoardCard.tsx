import type { FeatureRequest } from '@roadly/shared'
import { ArrowBigUp } from 'lucide-react'
import { formatRequestDate } from '@/lib/format-date'

export function BoardCard({ request }: { request: FeatureRequest }) {
  return (
    <li className="flex gap-3 rounded-lg border bg-card p-3">
      <div
        aria-label={`${request.voteCount} votes`}
        className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
      >
        <ArrowBigUp aria-hidden="true" className="size-4" />
        <span className="text-xs font-medium">{request.voteCount}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold">{request.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {request.category ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {request.category}
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">{formatRequestDate(request.createdAt)}</span>
        </div>
      </div>
    </li>
  )
}
