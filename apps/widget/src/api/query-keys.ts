import type { WidgetFeatureRequestSort } from '@roadly/shared'

export type FeatureRequestListScope = 'all' | 'mine'

export const widgetQueryKeys = {
  featureRequests: (widgetKey: string) => ['widget', widgetKey, 'feature-requests'] as const,
  featureRequestList: (
    widgetKey: string,
    scope: FeatureRequestListScope,
    sort: WidgetFeatureRequestSort,
    contactId: string | undefined,
  ) => [...widgetQueryKeys.featureRequests(widgetKey), { scope, sort, contactId }] as const,
}
