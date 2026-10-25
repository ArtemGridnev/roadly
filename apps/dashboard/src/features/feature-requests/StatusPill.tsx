import type { RequestStatus } from '@roadly/shared'
import { cn } from '@/lib/utils'
import { STATUS_META } from './request-status'

export function StatusPill({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_META[status].pillClassName,
      )}
    >
      {STATUS_META[status].label}
    </span>
  )
}
