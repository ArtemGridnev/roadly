import type { RequestStatus } from '@roadly/shared'
import { cn } from '../../lib/cn'

const STATUS_LABELS: Record<RequestStatus, string> = {
  BACKLOG: 'Backlog',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  SHIPPED: 'Shipped',
}

const STATUS_CLASSES: Record<RequestStatus, string> = {
  BACKLOG: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  PLANNED: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  IN_PROGRESS: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  SHIPPED: 'bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300',
}

interface StatusBadgeProps {
  status: RequestStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
