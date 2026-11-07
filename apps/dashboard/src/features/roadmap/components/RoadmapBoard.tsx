import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import type { FeatureRequest, RequestStatus } from '@roadly/shared'
import { Direction } from 'radix-ui'
import { useState } from 'react'
import { REQUEST_STATUSES } from '../../feature-requests/constants/request-status'
import { BoardCard } from './BoardCard'
import { BoardColumn } from './BoardColumn'
import { RtlAutoScroller } from './RtlAutoScroller'
import { useBoardDnd } from '../hooks/use-board-dnd'
import { useMoveRequest } from '../hooks/use-move-request'

interface RoadmapBoardProps {
  requests: FeatureRequest[]
  onOpen: (id: string) => void
}

export function RoadmapBoard({ requests, onOpen }: RoadmapBoardProps) {
  const dnd = useBoardDnd(requests)
  const isRtl = Direction.useDirection() === 'rtl'
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
      autoScroll={isRtl ? { threshold: { x: 0, y: 0.2 } } : true}
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
            onOpen={onOpen}
          />
        ))}
      </div>

      {isRtl && activeId ? <RtlAutoScroller /> : null}

      <DragOverlay dropAnimation={landedElsewhere ? null : undefined}>
        {activeRequest ? <BoardCard request={activeRequest} className="cursor-grabbing shadow-sm" /> : null}
      </DragOverlay>
    </DndContext>
  )
}
