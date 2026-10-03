import { useSyncExternalStore } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateWidgetFeatureRequestInput,
  FeatureRequest,
  WidgetFeatureRequest,
  WidgetFeatureRequestSort,
} from '@roadly/shared'
import { apiRequest } from './client'
import { widgetQueryKeys } from './query-keys'

export function useFeatureRequests(
  widgetKey: string,
  contactId: string | undefined,
  sort: WidgetFeatureRequestSort,
) {
  return useQuery({
    queryKey: widgetQueryKeys.featureRequestList(widgetKey, sort, contactId),
    queryFn: () =>
      apiRequest<WidgetFeatureRequest[]>(`/widget/feature-requests?sort=${sort}`, {
        widgetKey,
        contactId,
      }),
    placeholderData: keepPreviousData,
  })
}

export function useCachedFeatureRequest(
  widgetKey: string,
  contactId: string | undefined,
  requestId: string,
) {
  const queryClient = useQueryClient()

  const findRequest = () =>
    queryClient
      .getQueriesData<WidgetFeatureRequest[]>({
        queryKey: [...widgetQueryKeys.featureRequests(widgetKey), { contactId }],
      })
      .flatMap(([, requests]) => requests ?? [])
      .find((request) => request.id === requestId)

  return useSyncExternalStore(
    (onChange) => queryClient.getQueryCache().subscribe(onChange),
    findRequest,
  )
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
