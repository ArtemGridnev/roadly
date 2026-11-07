import type { RequestStatus } from '@roadly/shared'
import { ListFilter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { REQUEST_STATUSES } from '../../feature-requests/constants/request-status'

interface StatusFilterMenuProps {
  value: RequestStatus[]
  onChange: (statuses: RequestStatus[]) => void
}

export function StatusFilterMenu({ value, onChange }: StatusFilterMenuProps) {
  const { t } = useTranslation()
  const summary =
    value.length === REQUEST_STATUSES.length
      ? t('roadmap.filter.all')
      : value.length === 1
        ? t(`status.${value[0]}`)
        : t('roadmap.filter.selected', { count: value.length })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t('roadmap.filter.label', { value: summary })}>
          <ListFilter />
          <span className="hidden sm:inline">{summary}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {REQUEST_STATUSES.map((status) => (
          <DropdownMenuCheckboxItem
            key={status}
            checked={value.includes(status)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(checked ? [...value, status] : value.filter((selected) => selected !== status))
            }
          >
            {t(`status.${status}`)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
