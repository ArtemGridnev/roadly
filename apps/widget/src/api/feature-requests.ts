import { useSyncExternalStore } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateWidgetFeatureRequestInput,
  WidgetFeatureRequest,
  WidgetFeatureRequestSort,
} from '@roadly/shared'
import { apiRequest } from './client'
import { widgetQueryKeys, type FeatureRequestListScope } from './query-keys'

const FEATURE_REQUEST_LIST_PATHS: Record<FeatureRequestListScope, string> = {
  all: '/widget/feature-requests',
  mine: '/widget/feature-requests/mine',
}

export function useFeatureRequests(
  widgetKey: string,
  contactId: string | undefined,
  sort: WidgetFeatureRequestSort,
  scope: FeatureRequestListScope = 'all',
) {
  return useQuery({
    queryKey: widgetQueryKeys.featureRequestList(widgetKey, scope, sort, contactId),
    queryFn: () =>
      apiRequest<WidgetFeatureRequest[]>(`${FEATURE_REQUEST_LIST_PATHS[scope]}?sort=${sort}`, {
        widgetKey,
        contactId,
      }),
    enabled: scope === 'all' || contactId !== undefined,
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
      apiRequest<WidgetFeatureRequest>('/widget/feature-requests', {
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
