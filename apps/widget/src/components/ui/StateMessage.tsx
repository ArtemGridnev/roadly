import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface StateMessageProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function StateMessage({ icon: Icon, title, description, action }: StateMessageProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      {action}
    </div>
  )
}
