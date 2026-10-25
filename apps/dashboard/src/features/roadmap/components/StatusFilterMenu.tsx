import type { RequestStatus } from '@roadly/shared'
import { ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { REQUEST_STATUSES, STATUS_META } from '../../feature-requests/constants/request-status'

interface StatusFilterMenuProps {
  value: RequestStatus[]
  onChange: (statuses: RequestStatus[]) => void
}

function summary(value: RequestStatus[]) {
  if (value.length === REQUEST_STATUSES.length) {
    return 'All statuses'
  }
  if (value.length === 1) {
    return STATUS_META[value[0]].label
  }
  return `${value.length} statuses`
}

export function StatusFilterMenu({ value, onChange }: StatusFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Status filter: ${summary(value)}`}>
          <ListFilter />
          <span className="hidden sm:inline">{summary(value)}</span>
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
            {STATUS_META[status].label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
