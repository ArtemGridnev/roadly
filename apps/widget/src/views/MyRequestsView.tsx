import { useState } from 'react'
import type { WidgetFeatureRequestSort } from '@roadly/shared'
import { useFeatureRequests } from '../api/feature-requests'
import { useWidgetSession } from '../session/widget-session'
import { RequestList } from '../components/requests/RequestList'
import { SortToggle } from '../components/requests/SortToggle'

export function MyRequestsView() {
  const { widgetKey, contact, identifyError } = useWidgetSession()
  const [sort, setSort] = useState<WidgetFeatureRequestSort>('newest')
  const { data, isPending, error, refetch } = useFeatureRequests(widgetKey, sort)

  const myRequests = contact
    ? data?.filter((request) => request.authorId === contact.id)
    : undefined

  return (
    <RequestList
      requests={myRequests}
      isPending={isPending || !contact}
      error={error ?? identifyError}
      emptyTitle="You haven't requested anything yet"
      emptyDescription="Requests you submit will show up here with their status."
      onRetry={() => void refetch()}
      toolbar={<SortToggle value={sort} onChange={setSort} />}
    />
  )
}
