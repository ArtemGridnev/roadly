import { useDraggable } from '@dnd-kit/core'
import type { FeatureRequest } from '@roadly/shared'
import { cn } from '@/lib/utils'
import { BoardCard } from './BoardCard'

interface DraggableCardProps {
  request: FeatureRequest
  onOpen: (id: string) => void
}

export function DraggableCard({ request, onOpen }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: request.id,
    data: { status: request.status },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(request.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !isDragging) {
          event.preventDefault()
          onOpen(request.id)
          return
        }
        listeners?.onKeyDown?.(event)
      }}
      aria-label={request.title}
      className={cn(
        'cursor-grab rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        isDragging && 'opacity-40',
      )}
    >
      <BoardCard request={request} />
    </div>
  )
}
