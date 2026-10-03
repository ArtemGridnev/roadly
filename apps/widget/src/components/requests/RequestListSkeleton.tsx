import { Skeleton } from '../ui/Skeleton'

const PLACEHOLDER_COUNT = 3

export function RequestListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <div key={index} className="flex gap-3 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-12 w-11 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
