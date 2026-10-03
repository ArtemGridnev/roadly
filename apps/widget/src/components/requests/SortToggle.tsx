import type { WidgetFeatureRequestSort } from '@roadly/shared'

const SORT_OPTIONS: { value: WidgetFeatureRequestSort; label: string }[] = [
  { value: 'top', label: 'Most voted' },
  { value: 'newest', label: 'Newest' },
]

interface SortToggleProps {
  value: WidgetFeatureRequestSort
  onChange: (sort: WidgetFeatureRequestSort) => void
}

export function SortToggle({ value, onChange }: SortToggleProps) {
  return (
    <div role="group" aria-label="Sort requests" className="inline-flex self-start rounded-lg bg-secondary p-0.5">
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-border aria-pressed:bg-card aria-pressed:text-foreground"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
