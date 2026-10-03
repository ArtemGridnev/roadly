import { SearchX } from 'lucide-react'
import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { useCachedFeatureRequest } from '../../api/feature-requests'
import { useWidgetSession } from '../../session/widget-session'
import { PanelHeader } from '../layout/PanelHeader'
import { StateMessage } from '../ui/StateMessage'
import { RequestMeta } from './RequestMeta'
import { RequestVoteButton } from './RequestVoteButton'

interface RequestDetailOverlayProps {
  requestId: string
  onBack: () => void
}

export function RequestDetailOverlay({ requestId, onBack }: RequestDetailOverlayProps) {
  const { widgetKey, contact } = useWidgetSession()
  const request = useCachedFeatureRequest(widgetKey, contact?.id, requestId)
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onBack()
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="absolute inset-0 z-10 flex animate-overlay-in flex-col bg-background focus-visible:outline-none"
    >
      <PanelHeader title="Request" titleId={titleId} onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {request ? (
          <article className="flex gap-3">
            <RequestVoteButton request={request} />

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <h3 className="text-base font-semibold break-words text-foreground">
                {request.title}
              </h3>
              <RequestMeta request={request} />
              <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
                {request.description}
              </p>
            </div>
          </article>
        ) : (
          <StateMessage
            icon={SearchX}
            title="This request is no longer available"
            description="It may have been removed by the team."
          />
        )}
      </div>
    </div>
  )
}
