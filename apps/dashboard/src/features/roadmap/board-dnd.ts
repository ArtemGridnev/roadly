import {
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import type { FeatureRequest, RequestStatus } from '@roadly/shared'
import { REQUEST_STATUSES, STATUS_META } from '../feature-requests/request-status'

const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

const COLUMN_STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 }

const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const step = COLUMN_STEPS[event.code]
  if (!step) {
    return
  }
  event.preventDefault()

  const current = (context.over?.id ?? context.active?.data.current?.status) as RequestStatus
  const next = REQUEST_STATUSES[REQUEST_STATUSES.indexOf(current) + step]
  const rect = next && context.droppableRects.get(next)

  return rect ? { x: rect.left + 12, y: rect.top + 40 } : undefined
}

const screenReaderInstructions = {
  draggable:
    'Press enter to open the request. Press space to pick it up, the left and right arrow keys to move it between columns, space to drop it, and escape to cancel.',
}

function boardAnnouncements(titleOf: (id: UniqueIdentifier) => string | undefined): Announcements {
  const columnName = (id: UniqueIdentifier) => STATUS_META[id as RequestStatus].label

  return {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is over ${columnName(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${titleOf(active.id)} moved to ${columnName(over.id)}.` : `${titleOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled.`,
  }
}

export function useBoardDnd(requests: FeatureRequest[]) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: columnKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )
  const titleOf = (id: UniqueIdentifier) => requests.find((request) => request.id === id)?.title

  return {
    sensors,
    collisionDetection,
    accessibility: { announcements: boardAnnouncements(titleOf), screenReaderInstructions },
  }
}
