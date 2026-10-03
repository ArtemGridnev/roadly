import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Vote, WidgetFeatureRequest } from '@roadly/shared'
import { apiRequest } from './client'
import { widgetQueryKeys } from './query-keys'

const VOTE_MUTATION_KEY = ['widget', 'vote'] as const

interface CreateVoteParams {
  widgetKey: string
  contactId: string
  requestId: string
}

export function useVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: VOTE_MUTATION_KEY,
    mutationFn: ({ widgetKey, contactId, requestId }: CreateVoteParams) =>
      apiRequest<Vote>(`/widget/feature-requests/${requestId}/votes`, {
        method: 'POST',
        widgetKey,
        contactId,
      }),
    onMutate: async ({ widgetKey, requestId }) => {
      const queryKey = widgetQueryKeys.featureRequests(widgetKey)
      await queryClient.cancelQueries({ queryKey })

      const previousLists = queryClient.getQueriesData<WidgetFeatureRequest[]>({ queryKey })

      queryClient.setQueriesData<WidgetFeatureRequest[]>({ queryKey }, (requests) =>
        requests?.map((request) =>
          request.id === requestId
            ? { ...request, voteCount: request.voteCount + 1, hasVoted: true }
            : request,
        ),
      )

      return { previousLists }
    },
    onError: (_error, _params, context) => {
      context?.previousLists.forEach(([queryKey, requests]) => {
        queryClient.setQueryData(queryKey, requests)
      })
    },
    onSettled: (_data, _error, { widgetKey }) => {
      // Only the last in-flight vote refetches, so no refetch clobbers a pending vote.
      if (queryClient.isMutating({ mutationKey: VOTE_MUTATION_KEY }) === 1) {
        return queryClient.invalidateQueries({
          queryKey: widgetQueryKeys.featureRequests(widgetKey),
        })
      }
    },
  })
}
