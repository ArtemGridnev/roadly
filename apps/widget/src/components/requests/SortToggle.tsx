import type { WidgetFeatureRequestSort } from '@roadly/shared'
import { useLanguage } from '../../i18n/use-language'

const SORT_OPTIONS: WidgetFeatureRequestSort[] = ['top', 'newest']

interface SortToggleProps {
  value: WidgetFeatureRequestSort
  onChange: (sort: WidgetFeatureRequestSort) => void
}

export function SortToggle({ value, onChange }: SortToggleProps) {
  const { t } = useLanguage()

  return (
    <div role="group" aria-label={t.list.sortLabel} className="inline-flex self-start rounded-lg bg-secondary p-0.5">
      {SORT_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-border aria-pressed:bg-card aria-pressed:text-foreground"
        >
          {t.list.sort[option]}
        </button>
      ))}
    </div>
  )
}
