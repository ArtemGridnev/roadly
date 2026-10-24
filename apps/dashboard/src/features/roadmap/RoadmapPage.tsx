import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { PageContent } from '@/components/PageContent'
import { Button } from '@/components/ui/button'
import type { RootState } from '@/store'
import { useGetFeatureRequestsQuery } from '../feature-requests/feature-requests-api'
import { REQUEST_STATUSES } from '../feature-requests/request-status'
import { useCurrentWorkspace } from '../workspaces/current-workspace'
import { BoardSkeleton } from './BoardSkeleton'
import { RequestTable } from './RequestTable'
import { RequestTableSkeleton } from './RequestTableSkeleton'
import { RoadmapBoard } from './RoadmapBoard'
import { setSort, setStatusFilter, setView } from './roadmap-slice'
import { SortMenu } from './SortMenu'
import { StatusFilterMenu } from './StatusFilterMenu'
import { ViewToggle } from './ViewToggle'

const BOARD_SNAP =
  'snap-x snap-mandatory scroll-px-4 md:scroll-px-6 lg:snap-none has-[[data-dragging]]:snap-none'

export function RoadmapPage() {
  const workspace = useCurrentWorkspace()
  const { sort, view, statusFilter } = useSelector((state: RootState) => state.roadmap)
  const dispatch = useDispatch()
  const { data: requests, isLoading, isError, refetch } = useGetFeatureRequestsQuery({ sort })

  const isTable = view === 'table'
  const filtered = requests?.filter((request) => statusFilter.includes(request.status))

  return (
    <PageContent
      title="Roadmap"
      className={isTable ? undefined : BOARD_SNAP}
      actions={
        <>
          {isTable ? (
            <StatusFilterMenu value={statusFilter} onChange={(next) => dispatch(setStatusFilter(next))} />
          ) : null}
          <SortMenu value={sort} onChange={(next) => dispatch(setSort(next))} />
          <ViewToggle value={view} onChange={(next) => dispatch(setView(next))} />
        </>
      }
    >
      {isError ? (
        <div className="py-12">
          <LoadError onRetry={refetch} />
        </div>
      ) : isLoading || !requests || !filtered ? (
        isTable ? <RequestTableSkeleton /> : <BoardSkeleton />
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No requests yet. Install the widget so your users can send them.
          </p>
          <Button asChild>
            <Link to={`/${workspace.slug}/install`}>Install the widget</Link>
          </Button>
        </div>
      ) : !isTable ? (
        <RoadmapBoard requests={requests} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">No requests with these statuses.</p>
          <Button variant="outline" onClick={() => dispatch(setStatusFilter([...REQUEST_STATUSES]))}>
            Show all statuses
          </Button>
        </div>
      ) : (
        <RequestTable requests={filtered} />
      )}
    </PageContent>
  )
}
