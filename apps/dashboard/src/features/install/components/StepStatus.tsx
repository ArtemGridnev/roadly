import { CircleCheck, CircleDashed } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepStatusProps {
  done: boolean
  doneText: string
  waitingText: string
}

export function StepStatus({ done, doneText, waitingText }: StepStatusProps) {
  const Icon = done ? CircleCheck : CircleDashed

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        done
          ? 'bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300'
          : 'bg-muted text-muted-foreground',
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {done ? doneText : waitingText}
    </span>
  )
}
