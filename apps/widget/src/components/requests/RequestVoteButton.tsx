import type { MouseEvent } from 'react'
import type { WidgetFeatureRequest } from '@roadly/shared'
import { useToggleVote } from '../../api/votes'
import { useWidgetSession } from '../../session/widget-session'
import { VoteButton } from '../ui/VoteButton'

interface RequestVoteButtonProps {
  request: WidgetFeatureRequest
}

export function RequestVoteButton({ request }: RequestVoteButtonProps) {
  const { contactId } = useWidgetSession()
  const toggleVote = useToggleVote()
  const isVotingClosed = request.status === 'SHIPPED'

  const handleVote = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (!contactId || isVotingClosed || toggleVote.isPending) {
      return
    }

    toggleVote.mutate({ requestId: request.id, hasVoted: request.hasVoted })
  }

  return (
    <VoteButton
      count={request.voteCount}
      hasVoted={request.hasVoted}
      disabled={!contactId || isVotingClosed}
      onVote={handleVote}
    />
  )
}
