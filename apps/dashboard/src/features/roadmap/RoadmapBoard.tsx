import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import type { FeatureRequest, RequestStatus } from '@roadly/shared'
import { useState } from 'react'
import { REQUEST_STATUSES } from '../feature-requests/request-status'
import { BoardCard } from './BoardCard'
import { BoardColumn } from './BoardColumn'
import { useBoardDnd } from './board-dnd'
import { useMoveRequest } from './useMoveRequest'

export function RoadmapBoard({ requests }: { requests: FeatureRequest[] }) {
  const dnd = useBoardDnd(requests)
  const moveRequest = useMoveRequest()
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [landedElsewhere, setLandedElsewhere] = useState(false)

  const find = (id: UniqueIdentifier) => requests.find((request) => request.id === id)
  const activeRequest = activeId ? find(activeId) : undefined

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id)
    setLandedElsewhere(false)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    const request = find(active.id)
    setLandedElsewhere(Boolean(request && over && over.id !== request.status))

    if (request && over) {
      moveRequest(request, over.id as RequestStatus)
    }
  }

  return (
    <DndContext
      {...dnd}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div
        data-dragging={activeId ? '' : undefined}
        className="flex min-w-max items-start gap-4 lg:min-w-0"
      >
        {REQUEST_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            requests={requests.filter((request) => request.status === status)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={landedElsewhere ? null : undefined}>
        {activeRequest ? <BoardCard request={activeRequest} className="cursor-grabbing shadow-sm" /> : null}
      </DragOverlay>
    </DndContext>
  )
}
