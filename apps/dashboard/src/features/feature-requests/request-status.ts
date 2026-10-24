import { requestStatusSchema, type RequestStatus } from '@roadly/shared'

export const REQUEST_STATUSES = requestStatusSchema.options

interface StatusMeta {
  label: string
  titleClassName: string
  columnClassName: string
  dropRingClassName: string
}

export const STATUS_META: Record<RequestStatus, StatusMeta> = {
  BACKLOG: {
    label: 'Backlog',
    titleClassName: 'text-blue-700 dark:text-blue-300',
    columnClassName: 'bg-blue-500/5 dark:bg-blue-500/10',
    dropRingClassName: 'ring-blue-500',
  },
  PLANNED: {
    label: 'Planned',
    titleClassName: 'text-amber-700 dark:text-amber-300',
    columnClassName: 'bg-amber-500/5 dark:bg-amber-500/10',
    dropRingClassName: 'ring-amber-500',
  },
  IN_PROGRESS: {
    label: 'In progress',
    titleClassName: 'text-indigo-700 dark:text-indigo-300',
    columnClassName: 'bg-indigo-500/5 dark:bg-indigo-500/10',
    dropRingClassName: 'ring-indigo-500',
  },
  SHIPPED: {
    label: 'Shipped',
    titleClassName: 'text-green-700 dark:text-green-300',
    columnClassName: 'bg-green-500/5 dark:bg-green-500/10',
    dropRingClassName: 'ring-green-500',
  },
}
