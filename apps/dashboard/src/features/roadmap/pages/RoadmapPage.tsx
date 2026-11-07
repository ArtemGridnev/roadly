import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { PageContent } from '@/components/PageContent'
import { Button } from '@/components/ui/button'
import { useGetFeatureRequestsQuery } from '../../feature-requests/api/feature-requests-api'
import { REQUEST_STATUSES } from '../../feature-requests/constants/request-status'
import { useCurrentWorkspace } from '../../workspaces/hooks/use-current-workspace'
import { BoardSkeleton } from '../components/BoardSkeleton'
import { RequestDrawer } from '../components/RequestDrawer'
import { RequestTable } from '../components/RequestTable'
import { RequestTableSkeleton } from '../components/RequestTableSkeleton'
import { RoadmapBoard } from '../components/RoadmapBoard'
import { SortMenu } from '../components/SortMenu'
import { StatusFilterMenu } from '../components/StatusFilterMenu'
import { ViewToggle } from '../components/ViewToggle'
import { useRoadmapSettings } from '../hooks/use-roadmap-settings'

const BOARD_SNAP =
  'snap-x snap-mandatory scroll-px-4 md:scroll-px-6 lg:snap-none has-[[data-dragging]]:snap-none'

export function RoadmapPage() {
  const { t } = useTranslation()
  const workspace = useCurrentWorkspace()
  const { sort, view, statusFilter, updateSettings } = useRoadmapSettings()
  const { data: requests, isLoading, isError, refetch } = useGetFeatureRequestsQuery({ sort })
  const [openId, setOpenId] = useState<string | null>(null)
  const openRequest = requests?.find((request) => request.id === openId)

  const isTable = view === 'table'
  const filtered = requests?.filter((request) => statusFilter.includes(request.status))

  return (
    <PageContent
      title={t('roadmap.title')}
      className={isTable ? undefined : BOARD_SNAP}
      actions={
        <>
          {isTable ? (
            <StatusFilterMenu value={statusFilter} onChange={(next) => updateSettings({ statusFilter: next })} />
          ) : null}
          <SortMenu value={sort} onChange={(next) => updateSettings({ sort: next })} />
          <ViewToggle value={view} onChange={(next) => updateSettings({ view: next })} />
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
            {t('roadmap.empty')}
          </p>
          <Button asChild>
            <Link to={`/${workspace.slug}/install`}>{t('roadmap.installWidget')}</Link>
          </Button>
        </div>
      ) : !isTable ? (
        <RoadmapBoard requests={requests} onOpen={setOpenId} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t('roadmap.noMatches')}</p>
          <Button variant="outline" onClick={() => updateSettings({ statusFilter: [...REQUEST_STATUSES] })}>
            {t('roadmap.showAllStatuses')}
          </Button>
        </div>
      ) : (
        <RequestTable requests={filtered} onOpen={setOpenId} />
      )}
      <RequestDrawer request={openRequest} onClose={() => setOpenId(null)} />
    </PageContent>
  )
}
