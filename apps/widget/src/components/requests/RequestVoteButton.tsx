import type { MouseEvent } from 'react'
import type { WidgetFeatureRequest } from '@roadly/shared'
import { useToggleVote } from '../../api/votes'
import { useWidgetSession } from '../../session/widget-session'
import { VoteButton } from '../ui/VoteButton'

interface RequestVoteButtonProps {
  request: WidgetFeatureRequest
}

export function RequestVoteButton({ request }: RequestVoteButtonProps) {
  const { widgetKey, contact } = useWidgetSession()
  const toggleVote = useToggleVote()

  const handleVote = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (!contact || toggleVote.isPending) {
      return
    }

    toggleVote.mutate({
      widgetKey,
      contactId: contact.id,
      requestId: request.id,
      hasVoted: request.hasVoted,
    })
  }

  return (
    <VoteButton
      count={request.voteCount}
      hasVoted={request.hasVoted}
      disabled={!contact}
      onVote={handleVote}
    />
  )
}
