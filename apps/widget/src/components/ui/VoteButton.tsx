import { ArrowBigUp } from 'lucide-react'
import type { MouseEvent } from 'react'
import { cn } from '../../lib/cn'

interface VoteButtonProps {
  count: number
  hasVoted: boolean
  disabled: boolean
  onVote: (event: MouseEvent<HTMLButtonElement>) => void
}

export function VoteButton({ count, hasVoted, disabled, onVote }: VoteButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={hasVoted}
      disabled={disabled}
      onClick={onVote}
      className={cn(
        'flex w-11 shrink-0 flex-col items-center gap-0.5 self-start rounded-lg border py-1.5 transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        hasVoted
          ? 'border-primary bg-primary/10 text-primary enabled:hover:bg-primary/15'
          : 'border-border bg-background text-muted-foreground enabled:hover:border-primary enabled:hover:text-primary',
        disabled && 'opacity-50',
      )}
    >
      <ArrowBigUp className={cn('size-4', hasVoted && 'fill-current')} aria-hidden="true" />
      <span
        className={cn(
          'text-xs font-medium tabular-nums',
          hasVoted ? 'text-primary' : 'text-foreground',
        )}
      >
        <span className="sr-only">Upvote, </span>
        {count}
        <span className="sr-only"> votes</span>
      </span>
    </button>
  )
}
