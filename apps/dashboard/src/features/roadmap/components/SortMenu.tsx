import type { WidgetFeatureRequestSort } from '@roadly/shared'
import { ArrowDownUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const SORT_OPTIONS: WidgetFeatureRequestSort[] = ['top', 'newest']

interface SortMenuProps {
  value: WidgetFeatureRequestSort
  onChange: (sort: WidgetFeatureRequestSort) => void
}

export function SortMenu({ value, onChange }: SortMenuProps) {
  const { t } = useTranslation()
  const label = t(`roadmap.sort.${value}`)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t('roadmap.sort.label', { value: label })}>
          <ArrowDownUp />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(sort) => onChange(sort as WidgetFeatureRequestSort)}
        >
          {SORT_OPTIONS.map((sort) => (
            <DropdownMenuRadioItem key={sort} value={sort}>
              {t(`roadmap.sort.${sort}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
