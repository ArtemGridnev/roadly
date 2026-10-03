import { useState } from 'react'
import type { WidgetFeatureRequestSort } from '@roadly/shared'
import { useFeatureRequests } from '../api/feature-requests'
import { useWidgetSession } from '../session/widget-session'
import { RequestList } from '../components/requests/RequestList'
import { SortToggle } from '../components/requests/SortToggle'

interface RequestsViewProps {
  onSelectRequest: (requestId: string, trigger: HTMLElement | null) => void
}

export function RequestsView({ onSelectRequest }: RequestsViewProps) {
  const { widgetKey, contact } = useWidgetSession()
  const [sort, setSort] = useState<WidgetFeatureRequestSort>('top')
  const { data, isPending, error, refetch } = useFeatureRequests(widgetKey, contact?.id, sort)

  return (
    <RequestList
      requests={data}
      isPending={isPending}
      error={error}
      emptyTitle="No feature requests yet"
      emptyDescription="Be the first to tell the team what to build next."
      onRetry={() => void refetch()}
      onSelect={onSelectRequest}
      toolbar={<SortToggle value={sort} onChange={setSort} />}
    />
  )
}
