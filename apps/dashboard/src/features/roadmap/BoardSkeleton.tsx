import { Skeleton } from '@/components/ui/skeleton'
import { REQUEST_STATUSES } from '../feature-requests/request-status'

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto" aria-hidden="true">
      {REQUEST_STATUSES.map((status) => (
        <div key={status} className="flex w-72 shrink-0 flex-col gap-3 rounded-lg bg-muted/50 p-3 lg:w-auto lg:flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  )
}
