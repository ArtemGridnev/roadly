import { useSyncExternalStore } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateWidgetFeatureRequestInput,
  WidgetFeatureRequest,
  WidgetFeatureRequestSort,
} from '@roadly/shared'
import { useWidgetSession } from '../session/widget-session'
import { apiRequest } from './client'
import { widgetQueryKeys, type FeatureRequestListScope } from './query-keys'

const FEATURE_REQUEST_LIST_PATHS: Record<FeatureRequestListScope, string> = {
  all: '/widget/feature-requests',
  mine: '/widget/feature-requests/mine',
}

export function useFeatureRequests(
  sort: WidgetFeatureRequestSort,
  scope: FeatureRequestListScope = 'all',
) {
  const { widgetKey, session, contactId } = useWidgetSession()

  return useQuery({
    queryKey: widgetQueryKeys.featureRequestList(widgetKey, scope, sort, contactId),
    queryFn: () =>
      apiRequest<WidgetFeatureRequest[]>(`${FEATURE_REQUEST_LIST_PATHS[scope]}?sort=${sort}`, {
        widgetKey,
        session,
      }),
    enabled: scope === 'all' || contactId !== undefined,
    placeholderData: keepPreviousData,
  })
}

export function useCachedFeatureRequest(requestId: string) {
  const { widgetKey, contactId } = useWidgetSession()
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

export function useCreateFeatureRequest() {
  const { widgetKey, session } = useWidgetSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateWidgetFeatureRequestInput) =>
      apiRequest<WidgetFeatureRequest>('/widget/feature-requests', {
        method: 'POST',
        body: input,
        widgetKey,
        session,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: widgetQueryKeys.featureRequests(widgetKey) })
    },
  })
}
