import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateWidgetFeatureRequestInput,
  FeatureRequest,
  WidgetFeatureRequestSort,
} from '@roadly/shared'
import { apiRequest } from './client'
import { widgetQueryKeys } from './query-keys'

export function useFeatureRequests(widgetKey: string, sort: WidgetFeatureRequestSort) {
  return useQuery({
    queryKey: widgetQueryKeys.featureRequestList(widgetKey, sort),
    queryFn: () =>
      apiRequest<FeatureRequest[]>(`/widget/feature-requests?sort=${sort}`, { widgetKey }),
    placeholderData: keepPreviousData,
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
