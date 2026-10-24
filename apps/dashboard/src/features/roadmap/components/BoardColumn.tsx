import type { FeatureRequest, RequestStatus } from '@roadly/shared'
import { STATUS_LABELS } from '../../feature-requests/constants/request-status'
import { BoardCard } from './BoardCard'

interface BoardColumnProps {
  status: RequestStatus
  requests: FeatureRequest[]
}

export function BoardColumn({ status, requests }: BoardColumnProps) {
  const headingId = `column-${status}`

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-lg bg-muted/50 p-3 lg:w-auto lg:min-w-0 lg:flex-1"
    >
      <div className="flex items-center gap-2 px-1">
        <h2 id={headingId} className="text-sm font-semibold">
          {STATUS_LABELS[status]}
        </h2>
        <span className="text-xs text-muted-foreground">{requests.length}</span>
      </div>

      {requests.length ? (
        <ul className="flex flex-col gap-2">
          {requests.map((request) => (
            <BoardCard key={request.id} request={request} />
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
          No requests
        </p>
      )}
    </section>
  )
}
