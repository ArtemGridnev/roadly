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
import { StatusPill } from '../../feature-requests/components/StatusPill'

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
        <button
          type="button"
          className="block max-w-full cursor-pointer truncate rounded-lg text-left font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {info.getValue()}
        </button>
        <p className="truncate text-muted-foreground">{info.row.original.description}</p>
      </div>
    ),
  }),
  helper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusPill status={info.getValue()} />,
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

interface RequestTableProps {
  requests: FeatureRequest[]
  onOpen: (id: string) => void
}

export function RequestTable({ requests, onOpen }: RequestTableProps) {
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
            <TableRow key={row.id} className="cursor-pointer" onClick={() => onOpen(row.id)}>
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
