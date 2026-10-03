import type { WidgetFeatureRequest } from '@roadly/shared'
import { Inbox, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { RequestCard } from './RequestCard'
import { RequestListSkeleton } from './RequestListSkeleton'
import { StateMessage } from '../ui/StateMessage'
import { Button } from '../ui/Button'

interface RequestListContentProps {
  requests: WidgetFeatureRequest[] | undefined
  isPending: boolean
  emptyTitle: string
  emptyDescription: string
}

interface RequestListProps extends RequestListContentProps {
  error: unknown
  onRetry: () => void
  toolbar?: ReactNode
}

export function RequestList({ error, onRetry, toolbar, ...contentProps }: RequestListProps) {
  if (error) {
    return (
      <StateMessage
        icon={TriangleAlert}
        title="We couldn't load the requests"
        description="The connection to Roadly failed."
        action={
          <Button variant="secondary" className="mt-2" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <RequestListContent {...contentProps} />
    </div>
  )
}

function RequestListContent({
  requests,
  isPending,
  emptyTitle,
  emptyDescription,
}: RequestListContentProps) {
  if (isPending) {
    return <RequestListSkeleton />
  }

  if (!requests?.length) {
    return <StateMessage icon={Inbox} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <ul className="flex flex-col gap-3">
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
    </ul>
  )
}
