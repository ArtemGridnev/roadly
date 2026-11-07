import { SquareKanban, Table2, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { RoadmapView } from '../utils/roadmap-settings'

const VIEWS: { value: RoadmapView; icon: LucideIcon }[] = [
  { value: 'kanban', icon: SquareKanban },
  { value: 'table', icon: Table2 },
]

interface ViewToggleProps {
  value: RoadmapView
  onChange: (view: RoadmapView) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const { t } = useTranslation()

  return (
    <div role="group" aria-label={t('roadmap.view.label')} className="inline-flex rounded-lg border p-0.5">
      {VIEWS.map(({ value: view, icon: Icon }) => (
        <button
          key={view}
          type="button"
          aria-pressed={value === view}
          aria-label={t(`roadmap.view.${view}`)}
          onClick={() => onChange(view)}
          className={cn(
            'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
            value === view && 'bg-accent text-foreground',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t(`roadmap.view.${view}`)}</span>
        </button>
      ))}
    </div>
  )
}
