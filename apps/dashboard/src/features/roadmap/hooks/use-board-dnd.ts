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
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { REQUEST_STATUSES } from '../../feature-requests/constants/request-status'

const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

const COLUMN_STEPS: Record<string, Record<string, number>> = {
  ltr: { ArrowLeft: -1, ArrowRight: 1 },
  rtl: { ArrowLeft: 1, ArrowRight: -1 },
}

const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const isRtl = document.documentElement.dir === 'rtl'
  const step = COLUMN_STEPS[isRtl ? 'rtl' : 'ltr'][event.code]
  if (!step) {
    return
  }
  event.preventDefault()

  const current = (context.over?.id ?? context.active?.data.current?.status) as RequestStatus
  const next = REQUEST_STATUSES[REQUEST_STATUSES.indexOf(current) + step]
  const node = isRtl && next ? context.droppableContainers.get(next)?.node.current : null
  // dnd-kit's keyboard scrolling has the same negative scrollLeft problem as RtlAutoScroller.
  node?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  const rect = node ? node.getBoundingClientRect() : next && context.droppableRects.get(next)

  return rect ? { x: rect.left + 12, y: rect.top + 40 } : undefined
}

function boardAnnouncements(t: TFunction, titleOf: (id: UniqueIdentifier) => string | undefined): Announcements {
  const columnName = (id: UniqueIdentifier) => t(`status.${id as RequestStatus}`)

  return {
    onDragStart: ({ active }) => t('roadmap.dnd.pickedUp', { title: titleOf(active.id) }),
    onDragOver: ({ active, over }) =>
      over ? t('roadmap.dnd.over', { title: titleOf(active.id), status: columnName(over.id) }) : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? t('roadmap.dnd.moved', { title: titleOf(active.id), status: columnName(over.id) })
        : t('roadmap.dnd.dropped', { title: titleOf(active.id) }),
    onDragCancel: ({ active }) => t('roadmap.dnd.cancelled', { title: titleOf(active.id) }),
  }
}

export function useBoardDnd(requests: FeatureRequest[]) {
  const { t } = useTranslation()
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
    accessibility: {
      announcements: boardAnnouncements(t, titleOf),
      screenReaderInstructions: { draggable: t('roadmap.dnd.instructions') },
    },
  }
}
