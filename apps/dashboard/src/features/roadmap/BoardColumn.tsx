import { useDroppable } from '@dnd-kit/core'
import type { FeatureRequest, RequestStatus } from '@roadly/shared'
import { cn } from '@/lib/utils'
import { STATUS_META } from '../feature-requests/request-status'
import { DraggableCard } from './DraggableCard'

interface BoardColumnProps {
  status: RequestStatus
  requests: FeatureRequest[]
  onOpen: (id: string) => void
}

export function BoardColumn({ status, requests, onOpen }: BoardColumnProps) {
  const headingId = `column-${status}`
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = STATUS_META[status]

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        'flex w-[calc(100vw-5rem)] shrink-0 snap-start flex-col md:w-72 gap-3 rounded-lg p-3 ring-inset transition-shadow lg:w-auto lg:min-w-0 lg:flex-1',
        meta.columnClassName,
        meta.dropRingClassName,
        isOver && 'ring-2',
      )}
    >
      <div className="flex items-center gap-2 px-1">
        <h2 id={headingId} className={cn('text-sm font-semibold', meta.titleClassName)}>
          {meta.label}
        </h2>
        <span className="text-xs text-muted-foreground">{requests.length}</span>
      </div>

      {requests.length ? (
        <ul className="flex flex-col gap-2">
          {requests.map((request) => (
            <li key={request.id}>
              <DraggableCard request={request} onOpen={onOpen} />
            </li>
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
