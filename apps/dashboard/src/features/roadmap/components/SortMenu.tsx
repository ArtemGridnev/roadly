import type { WidgetFeatureRequestSort } from '@roadly/shared'
import { ArrowDownUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const SORT_LABELS: Record<WidgetFeatureRequestSort, string> = {
  top: 'Most voted',
  newest: 'Newest',
}

interface SortMenuProps {
  value: WidgetFeatureRequestSort
  onChange: (sort: WidgetFeatureRequestSort) => void
}

export function SortMenu({ value, onChange }: SortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Sort: ${SORT_LABELS[value]}`}>
          <ArrowDownUp />
          <span className="hidden sm:inline">{SORT_LABELS[value]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(sort) => onChange(sort as WidgetFeatureRequestSort)}
        >
          {Object.entries(SORT_LABELS).map(([sort, label]) => (
            <DropdownMenuRadioItem key={sort} value={sort}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
