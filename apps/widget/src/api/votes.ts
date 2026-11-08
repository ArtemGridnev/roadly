import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { WidgetFeatureRequest } from '@roadly/shared'
import { useWidgetSession } from '../session/widget-session'
import { apiRequest } from './client'
import { widgetQueryKeys } from './query-keys'

interface ToggleVoteParams {
  requestId: string
  hasVoted: boolean
}

export function useToggleVote() {
  const { widgetKey, session } = useWidgetSession()
  const queryClient = useQueryClient()

  const applyVote = (requestId: string, hasVoted: boolean) =>
    queryClient.setQueriesData<WidgetFeatureRequest[]>(
      { queryKey: widgetQueryKeys.featureRequests(widgetKey) },
      (requests) =>
        requests?.map((request) =>
          request.id === requestId
            ? {
                ...request,
                voteCount: request.voteCount + (hasVoted ? -1 : 1),
                hasVoted: !hasVoted,
              }
            : request,
        ),
    )

  return useMutation({
    mutationFn: ({ requestId, hasVoted }: ToggleVoteParams) =>
      apiRequest<unknown>(`/widget/feature-requests/${requestId}/votes`, {
        method: hasVoted ? 'DELETE' : 'POST',
        widgetKey,
        session,
      }),
    onMutate: async ({ requestId, hasVoted }) => {
      await queryClient.cancelQueries({ queryKey: widgetQueryKeys.featureRequests(widgetKey) })
      applyVote(requestId, hasVoted)
    },
    onError: (_error, { requestId, hasVoted }) => {
      applyVote(requestId, !hasVoted)
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: widgetQueryKeys.featureRequests(widgetKey),
        refetchType: 'none',
      }),
  })
}
