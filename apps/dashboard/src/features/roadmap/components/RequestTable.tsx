import type { FeatureRequest } from '@roadly/shared'
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
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

function ColumnHeader({ column }: { column: 'votes' | 'request' | 'status' | 'created' }) {
  const { t } = useTranslation()

  return t(`roadmap.table.${column}`)
}

function CreatedDate({ value }: { value: string }) {
  const { i18n } = useTranslation()

  return <span className="text-muted-foreground">{formatRequestDate(value, i18n.language)}</span>
}

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, FeatureRequest>()
const columns = helper.columns([
  helper.accessor('voteCount', {
    header: () => <ColumnHeader column="votes" />,
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  helper.accessor('title', {
    header: () => <ColumnHeader column="request" />,
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
    header: () => <ColumnHeader column="status" />,
    cell: (info) => <StatusPill status={info.getValue()} />,
  }),
  helper.accessor('createdAt', {
    header: () => <ColumnHeader column="created" />,
    cell: (info) => <CreatedDate value={info.getValue()} />,
  }),
])

const COLUMN_CLASSES: Record<string, string> = {
  voteCount: 'w-16',
  title: 'w-full max-w-0',
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
