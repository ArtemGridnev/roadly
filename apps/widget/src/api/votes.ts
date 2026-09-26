import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Vote } from '@roadly/shared'
import { apiRequest } from './client'
import { widgetQueryKeys } from './query-keys'

interface CreateVoteParams {
  widgetKey: string
  contactId: string
  requestId: string
}

export function useVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ widgetKey, contactId, requestId }: CreateVoteParams) =>
      apiRequest<Vote>(`/widget/feature-requests/${requestId}/votes`, {
        method: 'POST',
        widgetKey,
        contactId,
      }),
    onSuccess: (_data, { widgetKey }) => {
      queryClient.invalidateQueries({ queryKey: widgetQueryKeys.featureRequests(widgetKey) })
    },
  })
}
