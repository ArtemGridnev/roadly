import { useState } from 'react'
import type { WidgetFeatureRequestSort } from '@roadly/shared'
import { useFeatureRequests } from '../api/feature-requests'
import { useLanguage } from '../i18n/use-language'
import { useWidgetSession } from '../session/widget-session'
import { RequestList } from '../components/requests/RequestList'
import { SortToggle } from '../components/requests/SortToggle'

interface MyRequestsViewProps {
  onSelectRequest: (requestId: string, trigger: HTMLElement | null) => void
}

export function MyRequestsView({ onSelectRequest }: MyRequestsViewProps) {
  const { t } = useLanguage()
  const { widgetKey, contact, identifyError } = useWidgetSession()
  const [sort, setSort] = useState<WidgetFeatureRequestSort>('newest')
  const { data, isPending, error, refetch } = useFeatureRequests(
    widgetKey,
    contact?.id,
    sort,
    'mine',
  )

  return (
    <RequestList
      requests={data}
      isPending={isPending || !contact}
      error={error ?? identifyError}
      emptyTitle={t.list.emptyMineTitle}
      emptyDescription={t.list.emptyMineDescription}
      onRetry={() => void refetch()}
      onSelect={onSelectRequest}
      toolbar={<SortToggle value={sort} onChange={setSort} />}
    />
  )
}
