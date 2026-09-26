export const widgetQueryKeys = {
  featureRequests: (widgetKey: string) => ['widget', widgetKey, 'feature-requests'] as const,
}
