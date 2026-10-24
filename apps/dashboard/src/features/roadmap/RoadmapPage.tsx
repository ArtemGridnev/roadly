import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { PageContent } from '@/components/PageContent'
import { Button } from '@/components/ui/button'
import type { RootState } from '@/store'
import { useGetFeatureRequestsQuery } from '../feature-requests/feature-requests-api'
import { REQUEST_STATUSES } from '../feature-requests/request-status'
import { useCurrentWorkspace } from '../workspaces/current-workspace'
import { BoardColumn } from './BoardColumn'
import { BoardSkeleton } from './BoardSkeleton'
import { setSort } from './roadmap-slice'
import { SortMenu } from './SortMenu'

export function RoadmapPage() {
  const workspace = useCurrentWorkspace()
  const sort = useSelector((state: RootState) => state.roadmap.sort)
  const dispatch = useDispatch()
  const { data: requests, isLoading, isError, refetch } = useGetFeatureRequestsQuery({ sort })

  return (
    <PageContent
      title="Roadmap"
      actions={<SortMenu value={sort} onChange={(next) => dispatch(setSort(next))} />}
    >
      {isError ? (
        <div className="py-12">
          <LoadError onRetry={refetch} />
        </div>
      ) : isLoading || !requests ? (
        <BoardSkeleton />
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No requests yet. Install the widget so your users can send them.
          </p>
          <Button asChild>
            <Link to={`/${workspace.slug}/install`}>Install the widget</Link>
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto">
          {REQUEST_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              requests={requests.filter((request) => request.status === status)}
            />
          ))}
        </div>
      )}
    </PageContent>
  )
}
