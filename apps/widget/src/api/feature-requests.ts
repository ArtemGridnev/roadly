import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateWidgetFeatureRequestInput, FeatureRequest } from '@roadly/shared'
import { apiRequest } from './client'
import { widgetQueryKeys } from './query-keys'

export function useFeatureRequests(widgetKey: string) {
  return useQuery({
    queryKey: widgetQueryKeys.featureRequests(widgetKey),
    queryFn: () => apiRequest<FeatureRequest[]>('/widget/feature-requests', { widgetKey }),
  })
}

interface CreateFeatureRequestParams {
  widgetKey: string
  contactId: string
  input: CreateWidgetFeatureRequestInput
}

export function useCreateFeatureRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ widgetKey, contactId, input }: CreateFeatureRequestParams) =>
      apiRequest<FeatureRequest>('/widget/feature-requests', {
        method: 'POST',
        body: input,
        widgetKey,
        contactId,
      }),
    onSuccess: (_data, { widgetKey }) => {
      queryClient.invalidateQueries({ queryKey: widgetQueryKeys.featureRequests(widgetKey) })
    },
  })
}
