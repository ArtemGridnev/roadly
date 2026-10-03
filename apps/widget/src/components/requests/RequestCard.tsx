import { useRef } from 'react'
import type { WidgetFeatureRequest } from '@roadly/shared'
import { RequestMeta } from './RequestMeta'
import { RequestVoteButton } from './RequestVoteButton'

interface RequestCardProps {
  request: WidgetFeatureRequest
  onSelect: (requestId: string, trigger: HTMLElement | null) => void
}

export function RequestCard({ request, onSelect }: RequestCardProps) {
  const titleButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <li
      onClick={() => onSelect(request.id, titleButtonRef.current)}
      className="flex cursor-pointer gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <RequestVoteButton request={request} />

      <div className="min-w-0 flex-1">
        {/* Keyboard entry point; its click bubbles up to the card. */}
        <h3 className="text-sm font-semibold text-card-foreground">
          <button
            ref={titleButtonRef}
            type="button"
            className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {request.title}
          </button>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>

        <div className="mt-3">
          <RequestMeta request={request} />
        </div>
      </div>
    </li>
  )
}
