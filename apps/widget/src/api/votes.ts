import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { WidgetFeatureRequest } from '@roadly/shared'
import { apiRequest } from './client'
import { widgetQueryKeys } from './query-keys'

interface ToggleVoteParams {
  widgetKey: string
  contactId: string
  requestId: string
  hasVoted: boolean
}

export function useToggleVote() {
  const queryClient = useQueryClient()

  const applyVote = (widgetKey: string, requestId: string, hasVoted: boolean) =>
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
    mutationFn: ({ widgetKey, contactId, requestId, hasVoted }: ToggleVoteParams) =>
      apiRequest<unknown>(`/widget/feature-requests/${requestId}/votes`, {
        method: hasVoted ? 'DELETE' : 'POST',
        widgetKey,
        contactId,
      }),
    onMutate: async ({ widgetKey, requestId, hasVoted }) => {
      await queryClient.cancelQueries({ queryKey: widgetQueryKeys.featureRequests(widgetKey) })
      applyVote(widgetKey, requestId, hasVoted)
    },
    onError: (_error, { widgetKey, requestId, hasVoted }) => {
      applyVote(widgetKey, requestId, !hasVoted)
    },
    onSettled: (_data, _error, { widgetKey }) =>
      queryClient.invalidateQueries({
        queryKey: widgetQueryKeys.featureRequests(widgetKey),
        refetchType: 'none',
      }),
  })
}
