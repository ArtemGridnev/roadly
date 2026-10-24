import type { FeatureRequest } from '@roadly/shared'
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatRequestDate } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { STATUS_META } from '../feature-requests/request-status'

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, FeatureRequest>()
const columns = helper.columns([
  helper.accessor('voteCount', {
    header: 'Votes',
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  helper.accessor('title', {
    header: 'Request',
    cell: (info) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{info.getValue()}</p>
        <p className="truncate text-muted-foreground">{info.row.original.description}</p>
      </div>
    ),
  }),
  helper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
          STATUS_META[info.getValue()].pillClassName,
        )}
      >
        {STATUS_META[info.getValue()].label}
      </span>
    ),
  }),
  helper.accessor('category', {
    header: 'Category',
    cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
  }),
  helper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => <span className="text-muted-foreground">{formatRequestDate(info.getValue())}</span>,
  }),
])

const COLUMN_CLASSES: Record<string, string> = {
  voteCount: 'w-16',
  title: 'w-full max-w-0',
  category: 'hidden md:table-cell',
  createdAt: 'hidden whitespace-nowrap md:table-cell',
}

export function RequestTable({ requests }: { requests: FeatureRequest[] }) {
  const table = useTable({ features, columns, data: requests, getRowId: (request) => request.id })

  return (
    <div className="md:min-w-[44rem]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id} className={COLUMN_CLASSES[header.column.id]}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} className={COLUMN_CLASSES[cell.column.id]}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
