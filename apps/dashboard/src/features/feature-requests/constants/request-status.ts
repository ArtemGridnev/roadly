import { requestStatusSchema, type RequestStatus } from '@roadly/shared'

export const REQUEST_STATUSES = requestStatusSchema.options

export const STATUS_LABELS: Record<RequestStatus, string> = {
  BACKLOG: 'Backlog',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  SHIPPED: 'Shipped',
}
