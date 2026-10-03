import { ArrowBigUp } from 'lucide-react'

interface VoteCountProps {
  count: number
}

export function VoteCount({ count }: VoteCountProps) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-0.5 self-start rounded-lg border border-border bg-background py-1.5">
      <ArrowBigUp className="size-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-xs font-medium tabular-nums text-foreground">
        {count}
        <span className="sr-only"> votes</span>
      </span>
    </div>
  )
}
