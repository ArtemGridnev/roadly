import type { WidgetFeatureRequestSort } from '@roadly/shared'

export const widgetQueryKeys = {
  featureRequests: (widgetKey: string) => ['widget', widgetKey, 'feature-requests'] as const,
  featureRequestList: (widgetKey: string, sort: WidgetFeatureRequestSort) =>
    [...widgetQueryKeys.featureRequests(widgetKey), { sort }] as const,
}
