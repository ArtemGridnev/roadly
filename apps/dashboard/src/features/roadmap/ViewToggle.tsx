import { SquareKanban, Table2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RoadmapView } from './roadmap-slice'

const VIEWS: { value: RoadmapView; label: string; icon: LucideIcon }[] = [
  { value: 'kanban', label: 'Board', icon: SquareKanban },
  { value: 'table', label: 'Table', icon: Table2 },
]

interface ViewToggleProps {
  value: RoadmapView
  onChange: (view: RoadmapView) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div role="group" aria-label="View" className="inline-flex rounded-lg border p-0.5">
      {VIEWS.map(({ value: view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          aria-pressed={value === view}
          aria-label={label}
          onClick={() => onChange(view)}
          className={cn(
            'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
            value === view && 'bg-accent text-foreground',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
