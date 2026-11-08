import { useState } from 'react'
import type { WidgetFeatureRequestSort } from '@roadly/shared'
import { useFeatureRequests } from '../api/feature-requests'
import { useLanguage } from '../i18n/use-language'
import { RequestList } from '../components/requests/RequestList'
import { SortToggle } from '../components/requests/SortToggle'

interface RequestsViewProps {
  onSelectRequest: (requestId: string, trigger: HTMLElement | null) => void
}

export function RequestsView({ onSelectRequest }: RequestsViewProps) {
  const { t } = useLanguage()
  const [sort, setSort] = useState<WidgetFeatureRequestSort>('top')
  const { data, isPending, error, refetch } = useFeatureRequests(sort)

  return (
    <RequestList
      requests={data}
      isPending={isPending}
      error={error}
      emptyTitle={t.list.emptyTitle}
      emptyDescription={t.list.emptyDescription}
      onRetry={() => void refetch()}
      onSelect={onSelectRequest}
      toolbar={<SortToggle value={sort} onChange={setSort} />}
    />
  )
}
